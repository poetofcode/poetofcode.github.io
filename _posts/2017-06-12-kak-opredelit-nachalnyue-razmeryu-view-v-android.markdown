---
layout: post
title: "Как определить начальные размеры View в Android"
date: 2017-06-12 16:00:00 +0300
comments: true
category: programming
tags: android-dev programming
image: /images/android_sizes.png
---

Недавно я столкнулся с проблемой при экспериментировании с вёрсткой под Андроид. Вообще-то я хотел поиграть с анимацией вьюх и для этого мне нужно было вычислять размеры элементов в процессе анимации и в начальных/конечных фазах.

Но простой способ получить размеры View'хи при инициализации Activity (например, в коллбеках `onCreate` или даже `onResume`) не увенчался успехом: что `getWidth`, что `getHeight` возвращают 0.

Оказывается, это не баг, а "фича" - размер вьюхи можно узнать только после вызова метода `View.onMeasure`, который Андроид вызывает перед отрисовкой элемента, а происходит это, к несчастью, уже после отработки `Activity.onCreate` или `Activity.onResume`.

Но выход нашёлся (после гугления, как обычно): заключается в использовании объекта `ViewTreeObserver`, который позволяет добавить слушателя каких-либо событий изменения отображения View.

<!--more-->

Делается это так:

{% highlight java %}
// ...где-то в Activity.onCreate()

final ImageView imageView = (ImageView) findViewById(R.id.imageView);

ViewTreeObserver vto = imageView.getViewTreeObserver();
vto.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {

    @Override
    public void onGlobalLayout() {
        // Получаем размеры
        int w = imageView.getWidth();
        int h = imageView.getHeight();    	

        // Внимание! Код ниже обязателен: нужно не забыть отписать слушателя, так как в данном случае больше он нам не понадобится
        ViewTreeObserver obs = imageView.getViewTreeObserver();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            obs.removeOnGlobalLayoutListener(this);
        } else {
            obs.removeGlobalOnLayoutListener(this);
        }
    }
});
{% endhighlight %}

Для удобства будущего использования, я завёл статический класс-хелпер, в который добавляю методы-обёртки для такого кода:

<script src="https://gist.github.com/poetofcode/f10f0e1de0a193da95870553d9ce1a01.js"></script>

Тогда пример выше можно упросить до такого:

{% highlight java %}
// ...где-то в Activity.onCreate()

final ImageView imageView = (ImageView) findViewById(R.id.imageView);

ViewHelper.executeAfterViewHasDrawn(imageView, new Runnable() {
    @Override
    public void run() {
        // Получаем размеры
        int w = imageView.getWidth();
        int h = imageView.getHeight();
    }
});
{% endhighlight %}
