---
layout: post
title: "Паттерны парралелизма в Go: Конвейеры и аннулирование"
date: 2016-01-19 20:42:15 +0300
comments: true
categories: 
---

Притивы Go для многопоточности делают простым создание конвейеров данных, которые эффективно используют операции ввода/вывода и многопроцессорные системы. Этот пост показывает примеры таких конвейеров, выделяя тонкости, которые возникают, когда операции неудачно прерываются, а также даётся введение в техники для чистой обработки таких отказов.

# Что такое конвейер? #

Формальное определение конвейера в Go отсутствует, это всего лишь один вид многопоточных программ из многих. Неформально, конвейер это серия стадий, соединённых каналами, где каждая стадия является группой гоурутин, запускаемых одной функцией. В каждой стадии гоурутины 
* принимают значения от вышестоящих через входящие каналы
* выполняют некоторую функцию с этими данными, обычно производя новые значения
* посылают значения дальше через исходящие каналы

Каждая стадия имеет любое количество входящих и исходящих каналов, за исключением первой и последней, которые имеют только либо исходящие либо входящие каналы, соответственно. Первая стадия иногда назвается источником или генератором, последняя стадия - приёмником или потребителем.

Мы начнём с простого примера конвейера, чтобы объяснить идеи и техники. Позже, мы покажем более практичный пример. 

# Возведение чисел в квадрат #

Рассмотрим конвейер с тремя стадиями.

Первая стадия, `gen` - это функция, которая конвертирует список целых чисел в канал, который отдаёт целые числа из списка. Функция `gen` запускает гоурутину, которая шлёт целые числа в канал и закрывает канал, когда все значения будут посланы:

{% highlight go %}
func gen(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}
{% endhighlight %}

Вторая стадия, `sq`, принимает целые числа из канала и возвращает канал, который отдаёт квадрат каждого принятого целого числа. После того как входящий канал закроется и эта стадия пошлёт все значения вниз, закроется исходящий канал:

{% highlight go %}
func sq(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}
{% endhighlight %}

Функция `main` настраивает конвейер и запускает финальную стадию: значения принимаются из второй стадии и выводятся до тех пор, пока канал не закроется:

{% highlight go %}
func main() {
    // Set up the pipeline.
    c := gen(2, 3)
    out := sq(c)

    // Consume the output.
    fmt.Println(<-out) // 4
    fmt.Println(<-out) // 9
}
{% endhighlight %}

Поскольку `sq` имеет тот же тип своих входящего и исходящего каналов (от переводчика - в данном случае тип `int`), мы можем запускать её любое количество раз. Мы также можем переписать `main` в виде цикла по диапазону значений, как и другие стадии:

{% highlight go %}
func main() {
    // Set up the pipeline and consume the output.
    for n := range sq(sq(gen(2, 3))) {
        fmt.Println(n) // 16 then 81
    }
}
{% endhighlight %}

# Распределение и сведение #

Несколько функций могут читать из одного каннала до тех пор пока канал не закроется, это называется *распределение* (fan-out). Это обеспечивает способ рапределения работы между группой воркеров для распараллеливания использования CPU и ввода/вывода.

Функция может читать из нескольких входов и работать до тех пор пока все они не закроются посредством соединения (мультиплексирования) входящих каналов в один канал, который закроется, когда будут закрыты все входящие каналы. Это называется *сведение* (fan-in).

Мы можем поменять наш конвейер для запуска двух экхемпляров `sq`, где каждый читает из общего входящего канала. Мы вводим новую функцию `merge` для сведения результатов:

{% highlight go %}
func main() {
    in := gen(2, 3)

    // Distribute the sq work across two goroutines that both read from in.
    c1 := sq(in)
    c2 := sq(in)

    // Consume the merged output from c1 and c2.
    for n := range merge(c1, c2) {
        fmt.Println(n) // 4 then 9, or 9 then 4
    }
}
{% endhighlight %}

Функция `merge` конвертирует список каналов в один канал посредством запуска гоурутины для каждого входящего канала, которая копирует значения в единственный исходящий канал. Как только все исходящие гоурутины будут запущены, `merge` запускает ещё одну гоурутину для того чтобы закрыть исходящий канал после того как все передачи в этот канал будут завершены.

Пеередачи в закрытый канал вызывают `panic`, поэтому очень важно убедиться, что все передачи завершены до вызова `close`. Тип `sync.WaitGroup` предоставляет простой способ для обеспечения такой синхронизации: 

{% highlight go %}
func merge(cs ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)

    // Start an output goroutine for each input channel in cs.  output
    // copies values from c to out until c is closed, then calls wg.Done.
    output := func(c <-chan int) {
        for n := range c {
            out <- n
        }
        wg.Done()
    }
    wg.Add(len(cs))
    for _, c := range cs {
        go output(c)
    }

    // Start a goroutine to close out once all the output goroutines are
    // done.  This must start after the wg.Add call.
    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}
{% endhighlight %}

# Stopping short #

There is a pattern to our pipeline functions:

stages close their outbound channels when all the send operations are done.
stages keep receiving values from inbound channels until those channels are closed.
This pattern allows each receiving stage to be written as a range loop and ensures that all goroutines exit once all values have been successfully sent downstream.

But in real pipelines, stages don't always receive all the inbound values. Sometimes this is by design: the receiver may only need a subset of values to make progress. More often, a stage exits early because an inbound value represents an error in an earlier stage. In either case the receiver should not have to wait for the remaining values to arrive, and we want earlier stages to stop producing values that later stages don't need.

In our example pipeline, if a stage fails to consume all the inbound values, the goroutines attempting to send those values will block indefinitely:


{% highlight go %}
    // Consume the first value from output.
    out := merge(c1, c2)
    fmt.Println(<-out) // 4 or 9
    return
    // Since we didn't receive the second value from out,
    // one of the output goroutines is hung attempting to send it.
}
{% endhighlight %}

This is a resource leak: goroutines consume memory and runtime resources, and heap references in goroutine stacks keep data from being garbage collected. Goroutines are not garbage collected; they must exit on their own.

We need to arrange for the upstream stages of our pipeline to exit even when the downstream stages fail to receive all the inbound values. One way to do this is to change the outbound channels to have a buffer. A buffer can hold a fixed number of values; send operations complete immediately if there's room in the buffer:

{% highlight go %}
c := make(chan int, 2) // buffer size 2
c <- 1  // succeeds immediately
c <- 2  // succeeds immediately
c <- 3  // blocks until another goroutine does <-c and receives 1
{% endhighlight %}

When the number of values to be sent is known at channel creation time, a buffer can simplify the code. For example, we can rewrite gen to copy the list of integers into a buffered channel and avoid creating a new goroutine:

{% highlight go %}
func gen(nums ...int) <-chan int {
    out := make(chan int, len(nums))
    for _, n := range nums {
        out <- n
    }
    close(out)
    return out
}
{% endhighlight %}

Returning to the blocked goroutines in our pipeline, we might consider adding a buffer to the outbound channel returned by merge:

{% highlight go %}
func merge(cs ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int, 1) // enough space for the unread inputs
    // ... the rest is unchanged ...
{% endhighlight %}

While this fixes the blocked goroutine in this program, this is bad code. The choice of buffer size of 1 here depends on knowing the number of values merge will receive and the number of values downstream stages will consume. This is fragile: if we pass an additional value to gen, or if the downstream stage reads any fewer values, we will again have blocked goroutines.

Instead, we need to provide a way for downstream stages to indicate to the senders that they will stop accepting input.

# Explicit cancellation #

When main decides to exit without receiving all the values from out, it must tell the goroutines in the upstream stages to abandon the values they're trying it send. It does so by sending values on a channel called done. It sends two values since there are potentially two blocked senders:


{% highlight go %}
func main() {
    in := gen(2, 3)

    // Distribute the sq work across two goroutines that both read from in.
    c1 := sq(in)
    c2 := sq(in)

    // Consume the first value from output.
    done := make(chan struct{}, 2)
    out := merge(done, c1, c2)
    fmt.Println(<-out) // 4 or 9

    // Tell the remaining senders we're leaving.
    done <- struct{}{}
    done <- struct{}{}
}
{% endhighlight %}

The sending goroutines replace their send operation with a select statement that proceeds either when the send on out happens or when they receive a value from done. The value type of done is the empty struct because the value doesn't matter: it is the receive event that indicates the send on out should be abandoned. The output goroutines continue looping on their inbound channel, c, so the upstream stages are not blocked. (We'll discuss in a moment how to allow this loop to return early.)

{% highlight go %}
func merge(done <-chan struct{}, cs ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)

    // Start an output goroutine for each input channel in cs.  output
    // copies values from c to out until c is closed or it receives a value
    // from done, then output calls wg.Done.
    output := func(c <-chan int) {
        for n := range c {
            select {
            case out <- n:
            case <-done:
            }
        }
        wg.Done()
    }
    // ... the rest is unchanged ...
{% endhighlight %}

This approach has a problem: each downstream receiver needs to know the number of potentially blocked upstream senders and arrange to signal those senders on early return. Keeping track of these counts is tedious and error-prone.

We need a way to tell an unknown and unbounded number of goroutines to stop sending their values downstream. In Go, we can do this by closing a channel, because a receive operation on a closed channel can always proceed immediately, yielding the element type's zero value.

This means that main can unblock all the senders simply by closing the done channel. This close is effectively a broadcast signal to the senders. We extend each of our pipeline functions to accept done as a parameter and arrange for the close to happen via a defer statement, so that all return paths from main will signal the pipeline stages to exit.

{% highlight go %}
func main() {
    // Set up a done channel that's shared by the whole pipeline,
    // and close that channel when this pipeline exits, as a signal
    // for all the goroutines we started to exit.
    done := make(chan struct{})
    defer close(done)

    in := gen(done, 2, 3)

    // Distribute the sq work across two goroutines that both read from in.
    c1 := sq(done, in)
    c2 := sq(done, in)

    // Consume the first value from output.
    out := merge(done, c1, c2)
    fmt.Println(<-out) // 4 or 9

    // done will be closed by the deferred call.
}
{% endhighlight %}

Each of our pipeline stages is now free to return as soon as done is closed. The output routine in merge can return without draining its inbound channel, since it knows the upstream sender, sq, will stop attempting to send when done is closed. output ensures wg.Done is called on all return paths via a defer statement:

{% highlight go %}
func merge(done <-chan struct{}, cs ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)

    // Start an output goroutine for each input channel in cs.  output
    // copies values from c to out until c or done is closed, then calls
    // wg.Done.
    output := func(c <-chan int) {
        defer wg.Done()
        for n := range c {
            select {
            case out <- n:
            case <-done:
                return
            }
        }
    }
    // ... the rest is unchanged ...
{% endhighlight %}

Similarly, sq can return as soon as done is closed. sq ensures its out channel is closed on all return paths via a defer statement:

{% highlight go %}
func sq(done <-chan struct{}, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            select {
            case out <- n * n:
            case <-done:
                return
            }
        }
    }()
    return out
}
{% endhighlight %}

Here are the guidelines for pipeline construction:

stages close their outbound channels when all the send operations are done.
stages keep receiving values from inbound channels until those channels are closed or the senders are unblocked.
Pipelines unblock senders either by ensuring there's enough buffer for all the values that are sent or by explicitly signalling senders when the receiver may abandon the channel.

# Digesting a tree #

Let's consider a more realistic pipeline.

MD5 is a message-digest algorithm that's useful as a file checksum. The command line utility md5sum prints digest values for a list of files.

{% highlight bash %}
% md5sum *.go
d47c2bbc28298ca9befdfbc5d3aa4e65  bounded.go
ee869afd31f83cbb2d10ee81b2b831dc  parallel.go
b88175e65fdcbc01ac08aaf1fd9b5e96  serial.go
{% endhighlight %}

Our example program is like md5sum but instead takes a single directory as an argument and prints the digest values for each regular file under that directory, sorted by path name.

{% highlight bash %}
% go run serial.go .
d47c2bbc28298ca9befdfbc5d3aa4e65  bounded.go
ee869afd31f83cbb2d10ee81b2b831dc  parallel.go
b88175e65fdcbc01ac08aaf1fd9b5e96  serial.go
{% endhighlight %}

The main function of our program invokes a helper function MD5All, which returns a map from path name to digest value, then sorts and prints the results:

{% highlight go %}
func main() {
    // Calculate the MD5 sum of all files under the specified directory,
    // then print the results sorted by path name.
    m, err := MD5All(os.Args[1])
    if err != nil {
        fmt.Println(err)
        return
    }
    var paths []string
    for path := range m {
        paths = append(paths, path)
    }
    sort.Strings(paths)
    for _, path := range paths {
        fmt.Printf("%x  %s\n", m[path], path)
    }
}
{% endhighlight %}

The MD5All function is the focus of our discussion. In serial.go, the implementation uses no concurrency and simply reads and sums each file as it walks the tree.

{% highlight go %}
// MD5All reads all the files in the file tree rooted at root and returns a map
// from file path to the MD5 sum of the file's contents.  If the directory walk
// fails or any read operation fails, MD5All returns an error.
func MD5All(root string) (map[string][md5.Size]byte, error) {
    m := make(map[string][md5.Size]byte)
    err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        if !info.Mode().IsRegular() {
            return nil
        }
        data, err := ioutil.ReadFile(path)
        if err != nil {
            return err
        }
        m[path] = md5.Sum(data)
        return nil
    })
    if err != nil {
        return nil, err
    }
    return m, nil
}
{% endhighlight %}

# Parallel digestion #

In parallel.go, we split MD5All into a two-stage pipeline. The first stage, sumFiles, walks the tree, digests each file in a new goroutine, and sends the results on a channel with value type result:

{% highlight go %}
type result struct {
    path string
    sum  [md5.Size]byte
    err  error
}
{% endhighlight %}

sumFiles returns two channels: one for the results and another for the error returned by filepath.Walk. The walk function starts a new goroutine to process each regular file, then checks done. If done is closed, the walk stops immediately:

{% highlight go %}
func sumFiles(done <-chan struct{}, root string) (<-chan result, <-chan error) {
    // For each regular file, start a goroutine that sums the file and sends
    // the result on c.  Send the result of the walk on errc.
    c := make(chan result)
    errc := make(chan error, 1)
    go func() {
        var wg sync.WaitGroup
        err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
            if err != nil {
                return err
            }
            if !info.Mode().IsRegular() {
                return nil
            }
            wg.Add(1)
            go func() {
                data, err := ioutil.ReadFile(path)
                select {
                case c <- result{path, md5.Sum(data), err}:
                case <-done:
                }
                wg.Done()
            }()
            // Abort the walk if done is closed.
            select {
            case <-done:
                return errors.New("walk canceled")
            default:
                return nil
            }
        })
        // Walk has returned, so all calls to wg.Add are done.  Start a
        // goroutine to close c once all the sends are done.
        go func() {
            wg.Wait()
            close(c)
        }()
        // No select needed here, since errc is buffered.
        errc <- err
    }()
    return c, errc
}
{% endhighlight %}

MD5All receives the digest values from c. MD5All returns early on error, closing done via a defer:

{% highlight go %}
func MD5All(root string) (map[string][md5.Size]byte, error) {
    // MD5All closes the done channel when it returns; it may do so before
    // receiving all the values from c and errc.
    done := make(chan struct{})
    defer close(done)

    c, errc := sumFiles(done, root)

    m := make(map[string][md5.Size]byte)
    for r := range c {
        if r.err != nil {
            return nil, r.err
        }
        m[r.path] = r.sum
    }
    if err := <-errc; err != nil {
        return nil, err
    }
    return m, nil
}
{% endhighlight %}

# Bounded parallelism #

The MD5All implementation in parallel.go starts a new goroutine for each file. In a directory with many large files, this may allocate more memory than is available on the machine.

We can limit these allocations by bounding the number of files read in parallel. In bounded.go, we do this by creating a fixed number of goroutines for reading files. Our pipeline now has three stages: walk the tree, read and digest the files, and collect the digests.

The first stage, walkFiles, emits the paths of regular files in the tree:

{% highlight go %}
func walkFiles(done <-chan struct{}, root string) (<-chan string, <-chan error) {
    paths := make(chan string)
    errc := make(chan error, 1)
    go func() {
        // Close the paths channel after Walk returns.
        defer close(paths)
        // No select needed for this send, since errc is buffered.
        errc <- filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
            if err != nil {
                return err
            }
            if !info.Mode().IsRegular() {
                return nil
            }
            select {
            case paths <- path:
            case <-done:
                return errors.New("walk canceled")
            }
            return nil
        })
    }()
    return paths, errc
}
{% endhighlight %}

The middle stage starts a fixed number of digester goroutines that receive file names from paths and send results on channel c:

{% highlight go %}
func digester(done <-chan struct{}, paths <-chan string, c chan<- result) {
    for path := range paths {
        data, err := ioutil.ReadFile(path)
        select {
        case c <- result{path, md5.Sum(data), err}:
        case <-done:
            return
        }
    }
}
{% endhighlight %}

Unlike our previous examples, digester does not close its output channel, as multiple goroutines are sending on a shared channel. Instead, code in MD5All arranges for the channel to be closed when all the digesters are done:

{% highlight go %}
    // Start a fixed number of goroutines to read and digest files.
    c := make(chan result)
    var wg sync.WaitGroup
    const numDigesters = 20
    wg.Add(numDigesters)
    for i := 0; i < numDigesters; i++ {
        go func() {
            digester(done, paths, c)
            wg.Done()
        }()
    }
    go func() {
        wg.Wait()
        close(c)
    }()
{% endhighlight %}

We could instead have each digester create and return its own output channel, but then we would need additional goroutines to fan-in the results.

The final stage receives all the results from c then checks the error from errc. This check cannot happen any earlier, since before this point, walkFiles may block sending values downstream:

{% highlight go %}
    m := make(map[string][md5.Size]byte)
    for r := range c {
        if r.err != nil {
            return nil, r.err
        }
        m[r.path] = r.sum
    }
    // Check whether the Walk failed.
    if err := <-errc; err != nil {
        return nil, err
    }
    return m, nil
}
{% endhighlight %}

# Conclusion #

This article has presented techniques for constructing streaming data pipelines in Go. Dealing with failures in such pipelines is tricky, since each stage in the pipeline may block attempting to send values downstream, and the downstream stages may no longer care about the incoming data. We showed how closing a channel can broadcast a "done" signal to all the goroutines started by a pipeline and defined guidelines for constructing pipelines correctly.

Further reading:

Go Concurrency Patterns (video) presents the basics of Go's concurrency primitives and several ways to apply them.
Advanced Go Concurrency Patterns (video) covers more complex uses of Go's primitives, especially select.
Douglas McIlroy's paper Squinting at Power Series shows how Go-like concurrency provides elegant support for complex calculations.

**Оригинал:** [http://blog.golang.org/pipelines](http://blog.golang.org/pipelines)