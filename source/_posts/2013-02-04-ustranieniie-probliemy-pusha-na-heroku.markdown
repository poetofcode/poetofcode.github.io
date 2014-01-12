---
layout: post
title: "Устранение проблемы push'а на Heroku"
date: 2013-02-04 21:44:19 +0400
comments: true
categories: [bug, heroku, ssh, ubuntu, stackoverflow]
---

Недавно столкнулся со странной проблемой при попытке сделать <em>push</em> на облачный сервис [Heroku](https://www.heroku.com).

<pre>
$ git push heroku master
Agent admitted failure to sign using the key.
Permission denied (publickey).
fatal: The remote end hung up unexpectedly
</pre>

<p>
	При этом все ключи были, как и положено, сгенерированы и добавлены в heroku, соответственно, командами:</p>

<pre>
$ ssh-keygen -t rsa -C "poetinthecode@gmail.com"
$ heroku keys:add
</pre>

<p>
	В итоге решение было найдено после часового гугления и заключается оно в правильной настройке переменной окружения <em>SSH_AUTH_SOCK</em>:</p>

<pre>
$ SSH_AUTH_SOCK=0
</pre>
<p>
	Вот после этой странной команды, наконец-то можно сделать Push:</p>
<pre>
$ git push heroku master
</pre>
<p>
	Спасибо <a href="http://stackoverflow.com/a/6075594/1655801">StackOverflow</a>, как всегда выручил!</p>

