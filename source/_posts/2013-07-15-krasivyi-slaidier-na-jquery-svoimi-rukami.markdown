---
layout: post
title: "Красивый слайдер на JQuery своими руками"
date: 2013-07-15 16:54:28 +0400
comments: true
categories: [JavaScript, jQuery, plugin]
---

<script src="/assets/jsimpression/jsImpression.js" type="text/javascript"></script>
<link href="/stylesheets/jsimpression/jsImpression.css" rel="stylesheet" type="text/css" />

В продолжение предыдущего поста про написание собственного плагина, решил сделать свой простенький, но в то же время симпатичный jQuery-плагин. Выбрал для эксперимента тему слайдеров. 

<!-- more -->

Вот что получилось в итоге:

<div id="gallery" style="width: 100%; height: 390px; text-align: center;">
	<img class="active" src="/images/jsimpression/1.jpg" style="display: block;"/>
	<img src="/images/jsimpression/2.jpg" />
	<img src="/images/jsimpression/3.jpg" />
</div>

Слишком просто? Да...но ведь и код получился легкий и понятный! А это значит, что можно модернизировать его под свои нужды при необходимости.

Для использования, достаточно подключить в свой код HTML два файлика - js и css соответственно, а также применить плагин к вашему контейнеру с изображениями. Вот пример.

Разметка:
``` html
<div id="gallery">
	<img class="active" src="img/1.jpg" />
	<img src="img/2.jpg" />
	<img src="img/3.jpg" />
</div>
```

Подключение плагина:
``` html
<script src="jsImpression.js" type="text/javascript"></script>
<link href="jsImpression.css" rel="stylesheet" type="text/css" />
```

Привязка плагина к контейнеру

``` javascript
$(document).ready(function(){
        $("#gallery").jsImpression({interval: 3000});
});
```

Можно задавать свой интервал, а можно и опустить этот параметр, по-умолчанию он равен 6 секундам.

Удачи в написании собственных плагинов!

Адрес проекта на **bitbucket.org** - [тут](https://bitbucket.org/freeproger/jsimpression).

<script>
	$(document).ready(function(){
		    $("#gallery").jsImpression({interval: 3000});
	});
</script>
