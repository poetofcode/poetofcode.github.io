---
layout: post
title: "Паттерны парралелизма в Go: Конвейеры и аннулирование (перевод)"
date: 2016-01-19 20:42:15 +0300
comments: true
categories: 
---

Примитивы Go для многопоточности делают простым создание конвейеров данных, которые эффективно используют операции ввода/вывода и многопроцессорные системы. Этот пост показывает примеры таких конвейеров, выделяя тонкости, которые возникают, когда операции неудачно прерываются, а также даётся введение в техники для чистой обработки таких отказов.

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

# Краткое пояснение #

Для наших функций конвейера действует такой шаблон(паттерн):

* стадии закрывают свои исходящие каналы, когда все операции отсылки завершены.
* стадии принимают значения из входящих каналов до тех пор пока эти каналы не будут закрыты.

Этот паттерн позволяет каждой принимающей стадии быть записанной в виде цикла по диапазону и гарантировать, что все гоурутины завершаться в момент когда все значения будут успешно переданы далее.

Но в реальных конвейерах, стадии не вседа принимают все входящие значения. Иногда бывает спроектировано так: приёмнику возможно нужна только часть данных, чтобы продолжить работу. Наиболее часто, стадия завершается раньше, потому что входящее значение говорит об ошибке на предыдущей стадии. Или в другом случае приёмник не должен дожидаться пока придут оставшиеся данные, и мы хотим, чтобы предыдущие стадии завершили отправку значений, которые не нужны последующим.

В примере нашего конвейера, если стадия в результате сбоя не может принять входящие значения, гоурутины, пытаясь послать эти значения, будут навсегда заблокированы:

{% highlight go %}
    // Consume the first value from output.
    out := merge(c1, c2)
    fmt.Println(<-out) // 4 or 9
    return
    // Since we didn't receive the second value from out,
    // one of the output goroutines is hung attempting to send it.
}
{% endhighlight %}

Это утечка ресурсов: гоурутины расходуют память и процессорное время, а ссылки на переменные в стеке гоурутины защищают данные от сборщика мусора. Гоурутины не подлежат автоматическому очищению сборщиком мусора, они должны завершиться самостоятельно.

Нам необходимо првести в порядок вышестоящие стадии нашего конвейера, чтобы они завершались, когда нижестоящие стадии из-за сбоя не могут принять все входящие данные. Одним способом сделать это является изменение исходящих каналов на каналы с буфером. Буфер может хранить фиксированное число значений, операции посылки завершаются немедленно, если есть место в буфере:

{% highlight go %}
c := make(chan int, 2) // buffer size 2
c <- 1  // succeeds immediately
c <- 2  // succeeds immediately
c <- 3  // blocks until another goroutine does <-c and receives 1
{% endhighlight %}

Когда число значений к посылке известно на момент создания канала, буфер может упростить код. Для примера, мы можем переписать функцию `gen` для копирования списка целых чисел в буфферизованный канал и избежать создания новой гоурутины:

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

Возвращаясь к блокирующим гоурутинам в нашем конвейере, мы должны учесть добавление буфера к исходящему каналу, который возвращает функция `merge`:

{% highlight go %}
func merge(cs ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int, 1) // enough space for the unread inputs
    // ... the rest is unchanged ...
{% endhighlight %}

Хотя это устраняет блокирование гоурутины в нашей программе, это плохой код. Выбор размера буфера в 1 единицу здесь зависит от знания числа значений, которые будет принимать `merge` и числа значений, которые нижестоящие стадии будут принимать. Это очень хрупкое решение: если мы передаём дополнительное значение в `gen` или если нижестоящая стадия читает меньшее количество значений, у нас будут снова заблокированные гоурутины.

Вместо этого, нам нужно обеспечить способ для нижестоящих стадий, чтобы уведомить отправителей, что они (прим.пер. - нижестоящие стадии) будут прекращать приём.

# Явное аннулирование #

Когда `main` решает завершиться без приёма всех исходящих значений, она должна уведомить вышестоящие гоурутины отменить пытаться отсылать данные. Она делает это путём передачи значений в канал, который называется `done`. Передаются два значения поскольку есть два потенциально блокирующих отправителя:

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

Посылающие гоурутины заменяют свои операции отсылки на оператор `select`, который срабатывает либо, когда происходит отправка в `out`, либо, когда принимается значение из `done`. Тип значения `done` является пустой структурой, поскольку значение не важно: тут принимается событие, которое указывает, что отправка в `out` должна быть прервана. Гоурутина `output` продолжает выполнение цикла на своём входящем канале `c`, таким образом вышестоящие стадии не блокируются. (Скоро мы обсудим, как позволить этому циклу завершаться раньше.) 

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

У этого способа есть проблема: каждый нижестоящий приёмник должен знать число потенциально блокирующих вышестоящих отправителей и обеспечивать уведомление этих отправителей о раннем завершении. Отслеживание этих чисел утомительно и подвержено ошибкам.

Нам нужен способ известить о неизвестное и непривязанное число гоурутин о том, что необходимо прекратить отправку значений вниз. В Go, мы можем сделать это с помощью закрытия канала, поскольку операция приёма на закрытом канале всегда происходит немедленно, приводя к нулевому значению типа элемента.

Это означает, что `main` может разблокировать всех отправителей просто закрыв канал `done`. Это закрытие является эффективным широковещательным сигналом для отправителей. Мы расширяем каждый из наших функций конвейера для приёма канала `done` в качестве параметра и принятия мер, чтобы закрытие произошло посредством выражения `defer`, таким образом, чтобы все пути завершения из `main` завершали стадии конвейера.

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

Каждая стадия нашего кнвейера теперь свободно может завершиться как только будет закрыт канал `done`. Гоурутина `output` в функции `merge` может завершиться без дожидания приёма всех данных из своего входящего канала, поскольку она знает, что вышестоящий отправитель `sq` завершит попытки отправки, когда завершиться `done`. `output` гарантирует вызов `wg.Done` при любых способах выхода посредством выражения `defer`: 

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

Похожим образом, `sq` может возвратиться как только `done` будет закрыт. `sq` гарантирует, что её канал будет закрыт в любых случаях выхода с помощью `defer`:

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

Вот правила для построения конвейера:

* стадии закрывают свои исходящие каналы, когда все операции отправки будут завершены.
* стадии продолжают принимать значения из входящих каналов до тех пор, пока эти каналы не станут закрыты, либо отправители не будут разблокированны.

Конвейеры разблокируют отправителей либо убедившись, что есть место в буфере для всех значений, которые нужно послать, либо посредством явного уведомления отправителей, когда приёмник может прервать канал.

# Создание дайджеста каталога  #

Давайте рассмотрим более реалистичный конвейер.

MD5 это алгоритм дайджеста сообшений, который удобно использовать для подсчёта контрольных сумм файлов. Утилита `md5sum` печатает значения дайджестов для списка файлов.

{% highlight bash %}
% md5sum *.go
d47c2bbc28298ca9befdfbc5d3aa4e65  bounded.go
ee869afd31f83cbb2d10ee81b2b831dc  parallel.go
b88175e65fdcbc01ac08aaf1fd9b5e96  serial.go
{% endhighlight %}

Пример нашей программы похож на `md5sum`, но вместо этого принимает единственную директорию в качестве аргумента и печатает значения дайджестов для каждого обычного файла (прим.пер. - не каталога) в этой директории, отсортировав по имени.

{% highlight bash %}
% go run serial.go .
d47c2bbc28298ca9befdfbc5d3aa4e65  bounded.go
ee869afd31f83cbb2d10ee81b2b831dc  parallel.go
b88175e65fdcbc01ac08aaf1fd9b5e96  serial.go
{% endhighlight %}

Функция `main` нашей программы включает функцию-хелпер `MD5All`, которая возвращает хэш-мэп от имени пути к значению дайджеста, затем сортирует и выводит результат: 

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

Функция `MD5All` это ключевой момент нашего обсуждения. В `serial.go` реализация не использует многопоточность и просто читает и создаёт сумму для каждого файла, обходя каталог.

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

# Параллельный подсчёт дайджестов #

В `parallel.go` мы разделяем `MD5All` в двух-ступенчатый конвейер. Первая стадия `sumFiles` пробегает каталог, подсчитывает дайджест каждого файла в новой гоурутине и отправляет результаты на канал со значением типа результата:

{% highlight go %}
type result struct {
    path string
    sum  [md5.Size]byte
    err  error
}
{% endhighlight %}

`sumFiles` возвращает два канала: один для результатов и другой для ошибки, возвращённой `filepath.Walk`. Функция обхода запускает новую гоурутину для обработки каждого обычного файла, затем проверяет `done`. Если `done` закрыт, обход немедленно завершается:

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

`MD5All` принимает значение дайджеста от `c`. `MD5All` завершается раньше при ошибке, закрывая `done` посредством оператора `defer`: 

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

# Ограниченный параллелизм #

Реализация `MD5All` в `parallel.go` стартует новую гоурутину для каждого файла. В каталоге с большим количеством весомых файлов, это может потребовать больше памяти, чем доступно в системе. 

Мы можем лимитировать эти потребления путём огрраничения числа файлов, читаемых параллельно. В `bounded.go` мы делаем это путём создания фиксированного количества гоурутин для чтения файлов. Наш конвейер теперь имеет три стадии: обход каталога, чтение и подсчёт дайджестов файлов и сбор дайджестов.

Первая стадия `wakFiles` отдаёт пути обычных файлов в каталоге:

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

Средняя стадия стартует фиксированное количество гоурутин-дайджестеров, который принимают имена файлов из путей и отправляют результаты в канал `c`: 

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

В отличии от предыдущего нашего примера, дайджестеры не закрывают свои исходящие каналы, когда несколько гоурутин производят отправку в общий канал. Вместо этого, код в функции `MD5All` обеспечивает закрытие канала, когда все дайджестеры завершены:

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

Вместо этого каждый дайджестер мог бы создавать и возвращать свой собственный исходящий канал, но тогда нам бы понадобтлись дополнительные гоурутины для сведения результатов.

Финальная стадия принимает все результаты из `c`, затем проверяет ошибку из `errc`. Эта проверка не может происходить раньше, поскольку до этого момента `walkFiles` может блокировать отправку значений вниз: 

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

# Заключение #

Этот пост показывает техники для создания потоковых конвейеров данных в Go. Работа с отказами в таких конвейерах является необычной, поскольку каждая стадия в конвейере может блокировать попытки послать значения вниз и нижестоящие стадии могут перестать принимать входящие данные. Мы показали как закрытие канала может посылать широковещательный сигнал "done", чтобы все гоурутины работали как конвейер и определили правила для построения правильных конвейеров.

Дальнейшее чтение:

* [Паттерны многопоточности в Go](http://talks.golang.org/2012/concurrency.slide#1) ([видео](https://www.youtube.com/watch?v=f6kdp27TYZs)) показывает основы примитивов многопоточности в Go и несколько способов их применения.
* [Продвинутые паттерны параллелизма в Go](http://blog.golang.org/advanced-go-concurrency-patterns) ([видео](http://www.youtube.com/watch?v=QDDwwePbDtw)) раскрывает более сложные использвания примитивов Go, в особенности `select`.
* Статья Дугласа Макилроя, [Squinting at Power Series](http://swtch.com/~rsc/thread/squint.pdf), показывает, как параллелизм в стиле Go предоставляет изящную поддержку для сложных вычислений.

**Оригинал:** [http://blog.golang.org/pipelines](http://blog.golang.org/pipelines)