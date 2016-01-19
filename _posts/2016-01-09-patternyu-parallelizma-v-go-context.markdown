---
layout: post
title: "Паттерны параллелизма в Go: Context (перевод)"
date: 2016-01-09 16:15:57 +0300
comments: true
categories: 
---

В серверах Go, каждый входящий запрос обрабатывается в собственной гоурутине (потоке). Обработчики запроса часто запускают дополнительные гоурутины для доступа к бэкендам, таким как базы данных и RPC-сервисы. Набору гоурутин, работающих по какому-то запросу обычно нужен доступ к специфическим для запроса значениям, таким как идентификатор пользователя, токены авторизации и срок жизни запроса. Когда запрос остановлен или вышло время, все гоурутины, работающие по этому запросу должны быстро завершиться так, чтобы система могла вернуть все ресурсы, которые в них используются.

В Google, мы разработали пакет `context`, который делает простым передачу специфичных для запроса значений, сигналов завершения и сроков жизни посредстом API ко всем гоурутинам, участвующим в обработке запроса. Пакет находится в открытом доступе как [golang.org/x/net/context](http://golang.org/x/net/context). Этот пост описывает как использовать пакет и исллюстрирует полностью работающий пример.

# Контекст #

Ядро пакета `context` это тип Context:

{% highlight go %}
// A Context carries a deadline, cancelation signal, and request-scoped values
// across API boundaries. Its methods are safe for simultaneous use by multiple
// goroutines.
type Context interface {
    // Done returns a channel that is closed when this Context is canceled
    // or times out.
    Done() <-chan struct{}

    // Err indicates why this context was canceled, after the Done channel
    // is closed.
    Err() error

    // Deadline returns the time when this Context will be canceled, if any.
    Deadline() (deadline time.Time, ok bool)

    // Value returns the value associated with key or nil if none.
    Value(key interface{}) interface{}
}
{% endhighlight %}

(Это краткое описание; тут [http://godoc.org/golang.org/x/net/context](http://godoc.org/golang.org/x/net/context) более полное.)

Метод `done` возвращает канал, который действует в качестве сигнала завершения для функций, запущенных от имени `context`а: когда канал закрыт, функции должны прекратить свою работу и завершиться. Метод `Err` возвращает ошибку, индицирующую почему Context был отменен. В статье [Конвейеры и аннулирование](/2016/01/19/patternyu-parralelizma-v-go-konvejeryu-i-annulirovanie.html) обсуждается идиома канала `Done` более детально.

Context не имеет метода `Cancel` по той же причине, по которой канал `Done` является только принимающим: функиця принимающая сигнал завершения это обычно не та же самая, что посылает этот сигнал. В частности, когда родительская операция запускает гоурутины для дочерних операций, эти дочерние операции не должны быть способны отменить родильские. Вместо этого, функция `WithCancel` (описана ниже) обеспечивает способ отменить новый Context.

Context является безопасным для одновременного использования несколькими гоурутинами. Код может передавать единственный Context в любое число гоурутин и отменить этот контекст, чтобы известить их всех. 

Метод `Deadline` позволяет функциям определить должны ли они вообще начинать работу; если слишком мало времени осталось, тогда возможно не стоит. Код может также использовать срок жизни чтобы установить таймауты для операций ввода/вывода. 

Значение позволяет контексту переносить ограниченные запросом данные. Эти данные должны быть безопасными для использования в нескольких гоурутинах.

# Производные контексты #

Пакет контекста предоставляет функции для производства новых значений Context из существующего. Эти значения имеют форму дерева: когда Context отменен, все производные контексты от него также отменяются.

`Background` это корень в любом дереве контекста; он никогда не отменяется:

{% highlight go %}
// Background returns an empty Context. It is never canceled, has no deadline,
// and has no values. Background is typically used in main, init, and tests,
// and as the top-level Context for incoming requests.
func Background() Context
{% endhighlight %}

`WithCancel` и `WithTimeout` возвращают производные значения Context, которые могут быть отменены позже, чем родительский Context. Context ассоциированный с входящим запросом это обычно завершенный контекст в момент, когда обработчик запроса завершается. `WithCancel` также полезен для завершения лишних запросов при использовании нескольких реплик. `WithTimeout` полезен для установки дедлайнов на запросах к серверам бекенда:

{% highlight go %}
// WithCancel returns a copy of parent whose Done channel is closed as soon as
// parent.Done is closed or cancel is called.
func WithCancel(parent Context) (ctx Context, cancel CancelFunc)

// A CancelFunc cancels a Context.
type CancelFunc func()

// WithTimeout returns a copy of parent whose Done channel is closed as soon as
// parent.Done is closed, cancel is called, or timeout elapses. The new
// Context's Deadline is the sooner of now+timeout and the parent's deadline, if
// any. If the timer is still running, the cancel function releases its
// resources.
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc)
{% endhighlight %}

`WithValue` обеспечивает способ ассоциировать значения ограниченные запросом с контекстом:

{% highlight go %}
// WithValue returns a copy of parent whose Value method returns val for key.
func WithValue(parent Context, key interface{}, val interface{}) Context
{% endhighlight %}

Лучший путь увидеть как использовать пакет контекста это рабочий пример.

# Пример: Google Web Search #

Наш пример это HTTP сервер, который обрабатывает URL'ы наподобие `/search?q=golang&timeout=1s` отправляя запрос `golang` Google Web Search API и отображая результаты. Параметр `timeout` говорит серверу отменить запрос после достижения заданной длиетельности.

Код разбит на три пакета:

`server` обеспечивает функцию `main` и обработчки для `/search`.
`userip` предоставляет функции для выделения IP адреса пользоваетеля из запроса и ассоциирования его с Context'ом.
`google` предоставляет функцию `Search` для посылки запроса Google.

# Код server'а #

Код сервера обрабатывает запросы наподобие `/search?q=golang` посредством первых нескольких результатов поиска для `golang`. В нём регистрируется `handleSearch` для обработки адреса `/search`. Обработчик создаёт начальный контекст названный `ctx` и организует его отмену, когда `handler` завершается. Если запрос включает параметр таймаута в URL, то Context завершается автоматически когда выйдет время: 


{% highlight go %}
func handleSearch(w http.ResponseWriter, req *http.Request) {
    // ctx is the Context for this handler. Calling cancel closes the
    // ctx.Done channel, which is the cancellation signal for requests
    // started by this handler.
    var (
        ctx    context.Context
        cancel context.CancelFunc
    )
    timeout, err := time.ParseDuration(req.FormValue("timeout"))
    if err == nil {
        // The request has a timeout, so create a context that is
        // canceled automatically when the timeout expires.
        ctx, cancel = context.WithTimeout(context.Background(), timeout)
    } else {
        ctx, cancel = context.WithCancel(context.Background())
    }
    defer cancel() // Cancel ctx as soon as handleSearch returns.
{% endhighlight %}

Обработчик извлекает параметры из запроса и извлекает IP клиента путём вызова из пакета `userip`. IP адрес клиента необходимого для запросов бекенду, таким образом `handlerSearch` прикрепляет его к `ctx`:

{% highlight go %}
    // Check the search query.
    query := req.FormValue("q")
    if query == "" {
        http.Error(w, "no query", http.StatusBadRequest)
        return
    }

    // Store the user IP in ctx for use by code in other packages.
    userIP, err := userip.FromRequest(req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    ctx = userip.NewContext(ctx, userIP)
{% endhighlight %}

Обработчик вызывает `google.Search` с параметрами `ctx` и `query`:

{% highlight go %}
    // Run the Google search and print the results.
    start := time.Now()
    results, err := google.Search(ctx, query)
    elapsed := time.Since(start)
{% endhighlight %}

Если поиск успешен, то обработчик отображает результаты:

{% highlight go %}
    if err := resultsTemplate.Execute(w, struct {
        Results          google.Results
        Timeout, Elapsed time.Duration
    }{
        Results: results,
        Timeout: timeout,
        Elapsed: elapsed,
    }); err != nil {
        log.Print(err)
        return
    }
{% endhighlight %}

# Пакет userip #

Пакет `userip` обеспечивает функции для извлечения IP адреса пользователя из запроса и ассоциирует его с контекстом. Context предоставляет соответствие ключ-значение, где ключи и значения являются типами `interface{}`. Типы ключей должны поддерживать равенство, а значения должны быть безопасными для одновременного использования несколькими гоурутинами. Пакеты наподобие `userip` скрывают детали такого соответствия и обеспечивают строго-типизированный доступ к определённым значениям контекста.

Чтобы избежать коллизий ключей, `userip` определяет неэкспортируемый тип ключа и использует значение этого типа контексту ключа:

{% highlight go %}
// The key type is unexported to prevent collisions with context keys defined in
// other packages.
type key int

// userIPkey is the context key for the user IP address.  Its value of zero is
// arbitrary.  If this package defined other context keys, they would have
// different integer values.
const userIPKey key = 0
{% endhighlight %}

`FromRequest` извлекает значение `userIP` из `http.Request`:

{% highlight go %}
func FromRequest(req *http.Request) (net.IP, error) {
    ip, _, err := net.SplitHostPort(req.RemoteAddr)
    if err != nil {
        return nil, fmt.Errorf("userip: %q is not IP:port", req.RemoteAddr)
    }
{% endhighlight %}

`NewContext` возвращает новый Context, который переносит полученное значение `userIP`:

{% highlight go %}
func NewContext(ctx context.Context, userIP net.IP) context.Context {
    return context.WithValue(ctx, userIPKey, userIP)
}
{% endhighlight %}

`FromContext` извлекает `userIP` из Context'а:

{% highlight go %}
func FromContext(ctx context.Context) (net.IP, bool) {
    // ctx.Value returns nil if ctx has no value for the key;
    // the net.IP type assertion returns ok=false for nil.
    userIP, ok := ctx.Value(userIPKey).(net.IP)
    return userIP, ok
}
{% endhighlight %}


# Пакет google #

Функция `google.Search` делает запрос HTTP к Google Web Search API и парсит JSON результат. Она принимает параметр `ctx` и тут же возвращается, если `ctx.Done` закрыт пока запрос обрабатывается.   

Запрос Google Web Search API включает запрос поиска и пользовательский IP как `query`-парметры:

{% highlight go %}
func Search(ctx context.Context, query string) (Results, error) {
    // Prepare the Google Search API request.
    req, err := http.NewRequest("GET", "https://ajax.googleapis.com/ajax/services/search/web?v=1.0", nil)
    if err != nil {
        return nil, err
    }
    q := req.URL.Query()
    q.Set("q", query)

    // If ctx is carrying the user IP address, forward it to the server.
    // Google APIs use the user IP to distinguish server-initiated requests
    // from end-user requests.
    if userIP, ok := userip.FromContext(ctx); ok {
        q.Set("userip", userIP.String())
    }
    req.URL.RawQuery = q.Encode()
{% endhighlight %}

`Search` использует функцию хелпер, `httpDo`, чтобы осуществить HTTP-запрос и отменить его в случае если `ctx.Done` закрыт в течении запроса или если ответ обрабатывается. `Search` передаёт замыкание в `httpDo` для обработки запроса HTTP:  

{% highlight go %}
    var results Results
    err = httpDo(ctx, req, func(resp *http.Response, err error) error {
        if err != nil {
            return err
        }
        defer resp.Body.Close()

        // Parse the JSON search result.
        // https://developers.google.com/web-search/docs/#fonje
        var data struct {
            ResponseData struct {
                Results []struct {
                    TitleNoFormatting string
                    URL               string
                }
            }
        }
        if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
            return err
        }
        for _, res := range data.ResponseData.Results {
            results = append(results, Result{Title: res.TitleNoFormatting, URL: res.URL})
        }
        return nil
    })
    // httpDo waits for the closure we provided to return, so it's safe to
    // read results here.
    return results, err
{% endhighlight %}


Функция `httpDo` запускает запрос HTTP и обрабатывает его ответ в новой гоурутине. Она отменяет запрос если `ctx.Done` закрыт до завершения гоурутины:

{% highlight go %}
func httpDo(ctx context.Context, req *http.Request, f func(*http.Response, error) error) error {
    // Run the HTTP request in a goroutine and pass the response to f.
    tr := &http.Transport{}
    client := &http.Client{Transport: tr}
    c := make(chan error, 1)
    go func() { c <- f(client.Do(req)) }()
    select {
    case <-ctx.Done():
        tr.CancelRequest(req)
        <-c // Wait for f to return.
        return ctx.Err()
    case err := <-c:
        return err
    }
}
{% endhighlight %}


# Адаптация кода для Context'ов #

Многие серверные фрэймворки обеспечивают пакеты и типы для осуществления ограниченных запросом значений. Мы можем определить новые реализации интерфейса Context, чтобы обеспечить совместимость кода использующего существующие фрэймворки и кода, который ожидает параметр Context'а. 

Для примера, пакет фрэймворка Gorilla [github.com/gorilla/context](http://github.com/gorilla/context) предоставляет обработчики, чтобы ассоциировать данные с входящими запросами посредством преобразования из запросов HTTP в пары ключ-значение. В `gorilla.go`, мы обеспечиваем реализацию Context'а чей метод `Value` возвращает значения ассоциированные с определённым HTTP запросом в пакете Gorilla.

Другие пакеты имеют предопределёенный механизм отмены наподобие Context'у. Для примера, Tomb предлагает метод `Kill`, который сигнализирует об отмене путём закрытия канала `Dying`. Tomb также обеспечивает методы для ожидания выхода гоурутин, наподобие `sync.WaitGroup`. В `tomb.go` мы предоставляем реализацию Context'а, которая завершается либо когда его родительский Context завершится, либо когда будет завершён контекст предоставленный Tomb. 

# Заключение #

В Google мы требуем, чтобы программисты Go передавали параметр Context в качестве первого аргумента в каждую функцию на пути вызова между входящими и исходящими запросами. Это позволяет коду на Go, разработанному многими разными командами хорошо взаимодействовать. Это обеспечивает простой контроль над таймаутами и отменами, а также гарантирует правильную передачу критически важных значений наподобие приватных учётных данных в программах на Go.

Серерные фрэймворки, которые будут строиться на Context'е должны предоставить реализации Context'а, которые обеспечивают соответствие между своими пакетами и теми, которые ожидают Context в качестве параметра. Их клиентские библиотеки тогда могут принимть Context из вызываемого кода. Устанавливая общий интерфейс для данных ограниченных запросом и аннулированием, Context упрощает упрощает процесс распространения кода между разработчиками, помогая создавать масштабируемые сервисы.

**Оригинал:** [http://blog.golang.org/context](http://blog.golang.org/context)