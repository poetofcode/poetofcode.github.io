---
layout: post
title: "Как сделать модные ссылки-слайдеры с помощью CSS"
date: 2015-11-14 18:57:41 +0300
comments: true
categories: [css, вёрстка] 
tags: css вёрстка
---

Тут и там на сайтах сейчас появляются ссылки с подчёркиванием с эффектом слайдера (как в меню на сайте [MongoDB](https://www.mongodb.com/), например). Если они уже поменяли что-то, то на всякий случай оставляю пример тут:

<style type="text/css">
.link-example {
	display: inline-block;
    background: #444;
    padding: 10px;
}

.link-example a {
    display: inline-block;
    text-decoration: none;
    color: #FFFFFF;
    font-size: 22px;
}

.link-example a:after {
    content: '';
    display: block;
    height: 5px;
    width: 0;
    transition: width .5s;
    background: #00ABDD;
}

.link-example a:hover:after {
    width: 100%;
}
</style>

![CSS - ссылки с эффектом слайдинга](/images/slider-links-css.gif)

Наверняка, этот приём можно реализовать разными способами. Я приведу тот, который полностью устраивает меня, так как не требует никаких лишних тэгов в разметке, всё что нужно - это собственно ссылочный тэг `a`.

<!--more-->

CSS-код:
{% highlight css %}
a {
    display: inline-block;
    text-decoration: none;
}

a:after {
    content: '';
    display: block;
    height: 3px;
    width: 0;
    transition: width .5s;
    background: green;
}

a:hover:after {
    width: 100%;
}
{% endhighlight %}

Как видно по коду всё довольно просто - мы отменяем стандартное подчёркивание `text-decoration: none;` и создаём собственное анимированное "подчёркивание" в виде блока с помощью псевдоэлемента `:after` с изменением его ширины с `0` до `100%` при наведении курсора.

Вот рабочий примерчик такой ссылки (наведите курсор, чтобы протестировать нашу анимированную ссылку):

<p class="link-example">
<a href="#">Наведите курсор на этот текст :)</a>
</p>

А вот куда более [интересные примеры](http://thecodeplayer.com/walkthrough/simple-yet-amazing-css3-border-transition-effects) того, как можно обыграть ссылки...я нашёл это случайно, когда гуглил тему. Правда круто?! Я сам не устаю удивляться тому на что способен, вроде бы, привычный нам CSS!