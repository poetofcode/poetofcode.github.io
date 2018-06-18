---
layout: post
title: "Как быстро поднять VPN на своей VPS"
date: 2018-06-18 09:13:06 +0300
comments: true
category:
tags: [proxy, vps, vpn, google, digitalresistance]
image: /images/vpn.jpg
---

Сегодня рассмотрим суперпростой способ настроить собственный VPN. Основан на open-source VPN под названием - [Outline VPN](https://getoutline.org/), созданный в рамках проектов инкубатора [Jigsaw](https://jigsaw.google.com/projects/) от Google (а точнее её головной компании Alphabet).

Несмотря на то, что звучит всё это жутковато, настраивается и работает это превосходно, я всё проверил сам и очень доволен результатом.

![Outline VPN](/images/outline_vpn.png)

*- кстати, этот кругляшок прикольно так анимируется во время включения/отключения VPN, по всем канонам Material Design'а.*

<!--more-->

## Что понадобится для начала настройки

* Собственно, VPS

* Установленный на нём Docker

* Нерутовый пользователь, созданный на VPS

**Примечание:** что касается первых двух пунктов, то я уже описывал, как это всё сделать в одном из постов ранее: [Как поднять прокси для Telegram на своей VPS](http://poetofcode.ru/2018/04/25/kak-podnyat-proksi-dlya-telegram-na-svoej-vps.html)

Так что перейдём сразу к 3 пункту.


## Добавление нерутового пользователя

Подключаемся к своей VPS-ке по SSH из под root'а и выполняем:

{%highlight bash%}
useradd -m <username>

adduser <username> sudo
{%endhighlight%}

- тут, конечно же, нужно придумать какой-нибудь ник и заменить `<username>` на него.


## Установка Outline VPN Server

Запустите следующую команду:

{%highlight bash%}
$ sudo wget -qO- https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/server_manager/install_scripts/install_server.sh | bash
{%endhighlight%}

Если всё пройдёт успешно, то в выводе цветом будет выделены подобные строчки:

{%highlight json%}
{
  "apiUrl": "https://123.456.78.9:12345/xxxxxxxxxxxxxxxxxxxxxxx",
  "certSha256": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
{%endhighlight%}

- эта информация потребуется нам в следующем шаге.

## Управление VPN-сервером

Для управления сервером создано специальное десктопное приложение - **Outline Manager**. То есть делать ничего на самой VPS'е с этого момента вообще не нужно. Настройка будет производится с локальной машины с помощью этого приложения.

Оно доступно для Windows/Linux/MacOS. У меня win-10, так что я использовал Win-версию, соответственно.

Вот ссылки для скачивания:

* [Windows-версия](https://github.com/Jigsaw-Code/outline-releases/raw/master/manager/Outline-Manager.exe)

* [Linux-версия](https://github.com/Jigsaw-Code/outline-releases/raw/master/manager/Outline-Manager.AppImage)

* [MacOS-версия](https://github.com/Jigsaw-Code/outline-releases/raw/master/manager/Outline-Manager.dmg)

Когда вы установите и запустите Manager, прокрутите ползунок вниз до **Set up Outline anywhere** и нажмите кнопку **Get started**:

![vpn get started](/images/vpn_1.png)

Далее нужно скопировать во второе серое поле текст из предыдущего пункта (вот это вот - `{"apiUrl": ...}`):

![vpn setup](/images/vpn_2.png)

Далее, напротив **My access key** нажмите кнопку **GET CONNECTED**. Скачается, собственно, клиент VPN, через который мы и будем выходить в сеть *без блокировок*.

После запуска клиента, на [https://2ip.ru/](https://2ip.ru/) можно проверить, что теперь у вас другой IP, а именно IP вашей VPS'ки.

## Настроил сам - поделись с друзьями

Через Outline Manager можно также дать доступ к VPN своим друзьям. Для этого в нём нажмите кнопку **Add key** и присвойте имя. Затем, нажав на **Share**, вы можете поделиться ссылкой на URL, которая позволит установить VPN-клиент друзьям. 

Ну вот и всё - спасибо за чтение и приятного сёрфинга!

> Инструкция подготовлена по материалам поста:
[https://blog.ssdnodes.com/blog/tutorial-installing-alphabets-outline-vpn-on-your-vps/](https://blog.ssdnodes.com/blog/tutorial-installing-alphabets-outline-vpn-on-your-vps/)