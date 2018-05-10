---
layout: post
title: "Как поднять прокси для Telegram на своей VPS"
date: 2018-04-25 12:25:30 +0300
comments: true
category:
tags: [telegram, proxy, vps, digitalresistance]
image: images/telegram.jpg
---
Итак, нам понадобятся всего 3 вещи: 

1. VPS на линуксе и подключение к ней по ssh
2. Docker
3. И репозиторий socks-proxy, заранее заготовленный добрыми людьми, на Github.

Теперь подробнее об этом (в качестве примера, я опишу алгоритм, который сработал в моём случае).

<!--more-->

## 1. Регистрируем VPS. ##

Я брал облачный сервер здесь [Aruba Cloud VPS](https://www.arubacloud.com/vps/virtual-private-server-range.aspx), потому что он дешёвый - 1 евро в месяц. Этот минимальный тариф включает такую конфигурацию: 1cpu, 1гиг озу, 20гб ssd и 2тб трафика. Выгодно.

После регистрации нужно создать сам сервер. Я выбирал в качестве ОС - **Ubuntu 16.04 LTS**. При создании потребуется также выбрать пароль для root.

После регистрации и создания сервера в админке у вас должно отображаться примерно такое:

![aruba-vps-admin](/images/tg_vps_admin.png)

**Замечание**: создание сервера почему-то в моём случае вышло очень долгим по времени (часа 4-5), но всё-таки закончилось успешно. Так что, возможно, придётся подождать.

### Подключение к VPS по SSH ###

Моя ОС - Windows 10, так что для ssh-подключения я использовал [putty](https://www.putty.org/). Где найти ip-адрес - я указал на предыдущем скриншоте красным, пользователь - root, а пароль тот, что вы выбрали для своей VPS при создании:

![ssh-window](/images/tg_putty.png)

## 2. Установка Docker ##

> **Docker** - это программа, которая позволит нам запустить прокси, не углублясь в тонкости установки и настройки инструментов для этого. Кто угодно может заранее сделать, так называемый, docker-контейнер, который уже будет включать всё необходимое. Оним из них воспользуемся в следующем шаге.

Вот - [инструкция из оф.документации по установке Docker на Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/), но я приведу их здесь для удобства:

{% highlight bash %}

// 0. Удаляем старые версии, если были:
apt-get remove docker docker-engine docker.io

// 1
apt-get update

// 2
apt-get install \
   apt-transport-https \
   ca-certificates \
   curl \
   software-properties-common

// 3
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

// 4
add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

// 5
apt-get update

// 6. Наконец, установка Docker
apt-get install docker-ce

{% endhighlight %}

## 3. Запуск прокси ##

В моём случае сработал один из нескольких найденных репозиториев для socks-прокси на Github. Я сделал от него форк: [https://github.com/poetofcode/telegram_proxy](https://github.com/poetofcode/telegram_proxy).

Всё просто, в консоли выполняем следующее:

{% highlight bash %}

docker run -d --name=telegram_proxy -p 1080:1080 --restart=always koppektop/telegram-proxy

{% endhighlight %}

Теперь, если всё сработало верно, то можно подрубаться к этому прокси из Telegram. Для простоты настройки клиента Telegram'а можно создать ссылку вида: 

[https://t.me/socks?server=IP_ВАШЕГО_VPS&port=1080](#)

Теперь можно делиться ею с другими пользователями, которым вы решите помочь с обходом блокировки.

![tg_proxy_settings](/images/tg_proxy_settings.png)

## Примечание: полезные команды Docker'а ##

Вот некоторые команды, которые возможно помогут, если что-то пошло не так:

{% highlight bash %}

// Проверка запущен ли контейнер:
docker inspect -f '{ {.State.Running} }' ИМЯ_КОНТЕЙНЕРА
// - тут не должно быть пробела между фигурными скобками!!! 
// ..почему-то без пробелов содержимое съедает движок блога :(

// Посмотреть логи:
docker logs ИМЯ_КОНТЕЙНЕРА

// Узнать айдишник контейнера:
docker ps -a -q --filter="name=ИМЯ_КОНТЕЙНЕРА"

// Остановить контейнер:
docker stop АЙДИШНИК_КОНТЕЙНЕРА

// Остановить/удалить все контейнеры:
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)

{% endhighlight %}