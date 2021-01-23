---
layout: post
title: "Фрагменты вместо Активити: обработчик кнопки 'назад' - часть 2"
date: 2021-01-23 11:38:48 +0300
comments: true
category:
tags:  [android, android-dev, programming]
image: /images/android/activity-02.png
---

Реализуем пример навигации по экранам посредством Фрагментов. [В первой части](/2021/01/14/fragmentyu-vmesto-activity-vvedenie.html) я перечислил проблемы при реализации навигации по экранам, используя Фрагменты в качестве функциональных экранов приложения.

![Скриншот из примера](/images/android/activity-02-post.png)

Теперь я опишу, как обычно решаю первую проблему: отсутствие обработчика возврата в классе Фрагмента на предыдущий Фрагмент/Активити.

## onBackPressed в классе Активити

В классе Активити есть метод, который переопределяют, чтобы ловить событие нажатия системной кнопки “Назад”:


{% highlight java %}
@Override
public void onBackPressed() {
    
    // Какие-то действия, как, например, вывод сообщения: "Нажмите 'Назад' второй раз для выхода из приложения"
    super.onBackPressed();
}
{% endhighlight %}

Но в классе Фрагмента этого удобного метода нет, потому что Фрагменты задумывались как частичные представления, а не как замена Активити — то есть экраны в приложении.

## Принцип решения

Ключевые шаги:

1. Вводим интерфейс `OnBackButtonListener`, в котором определяем единственный метод `boolean onBackPressed()`.
2. Каждый класс Фрагмента, в котором нужно обработать событие нажатия кнопки “Назад”, должен реализовывать этот интерфейс.
3. В методе `onBackPressed()` главной `MainActivity` реализуем логику по вызову собственного обработчика Фрагмента.

## Пример приложения

Для этой части я реализовал пример. Видео к нему:

<iframe width="560" height="315" src="https://www.youtube.com/embed/2X_kx29x0II" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Там есть всего три экрана и реализованы переходы между ними. На третьем последнем экране пользователь запускает действие. По факту, там ничего не делается и просто реализована пауза, во время которой отображается индикатор прогресса.

Я представил случай, что по какой-то причине, когда это действие выполняется, то необходимо дождаться его выполнения и не дать пользователю возможность закрыть Фрагмент по кнопке назад. *В реальном приложении лучше не блокировать пользователя таким способом, но тут это используется для примера.*

## Пишем код

Полный код примера можно посмотреть в моём гитхабе:

[https://github.com/poetofcode/FragmentsWithBackAction](https://github.com/poetofcode/FragmentsWithBackAction)

А тут я приведу только самые важные части, по теме поста.

### 1. Интерфейс OnBackButtonListener

{% highlight java %}
package ru.poetofcode.fragmentswithbackaction;

public interface OnBackButtonListener {

    boolean onBackPressed();

}
{% endhighlight %}

Метод `onBackPressed()` определён тут с результирующим параметром `boolean`, а не `void`, чтобы иметь возможность отменить стандартный ход выполнения `onBackPressed` в Активити (в моей реализации я обычно отдаю `true`, когда хочу запретить выход из Фрагмента). Таким образом, если это нужно, можно запретить возврат назад по нажатию кнопки. Например, часто можно увидеть в приложениях такой приём, где это используется — при нажатии кнопки “Назад” приложение выводит сообщение: “Нажмите назад ещё раз для выхода из приложения”.

### 2. Код шаблона главной Активити

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/fragment_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity" />
{% endhighlight %}

Сама `MainActivity` служит лишь контейнером для вложенных полноэкранных Фрагментов. Тут необходимо присвоить родительскому элементу `id`, я обычно добавляю в название слово `container`

### 3. Реализуем интерфейс OnBackButtonListener

Так выглядит код третьего фрагмента (на видео — тот, что запускает длительную операцию):

{% highlight java %}
public class ThirdFragment extends Fragment implements OnBackButtonListener {

    boolean running = false;

    // ...

    @Override
    public boolean onBackPressed() {
        if (running) {
            Toast.makeText(getActivity(), "The operation is still in progress", Toast.LENGTH_LONG).show();
            return true;
        }
        return false;
    }
}
{% endhighlight %}

Я опустил тут часть, где реализуется само действие по нажатию кнопки, но нам тут важно, что в момент выполнения устанавливается флаг `running` в `true`. Таким образом, мы можем проверить — разрешать ли покидать Фрагмент. В противном случае — мы выводим пользователю сообщение.

### 4. Реализация onBackPressed() в главной Активити

Это самый важный пункт. Тут мы пользуемся `FragmentManager`ом, для того, чтоб определить какой Фрагмент в данный момент является активным/текущим:

{% highlight java %}
@Override
public void onBackPressed() {
    int backStackCount = getSupportFragmentManager().getBackStackEntryCount();

    // Находим текущий Фрагмент и вызваем его метод: onBackPressed()
    if (backStackCount > 0) {
        Fragment currentFragment = getSupportFragmentManager().findFragmentById(R.id.fragment_container);
        if (currentFragment instanceof OnBackButtonListener) {

            OnBackButtonListener backListener = (OnBackButtonListener) currentFragment;
            boolean actionResult = backListener.onBackPressed();

            if (actionResult) {
                return;
            }
        }
    }

    super.onBackPressed();
}
{% endhighlight %}

Тут нужно обратить внимание на две вещи:

1. Текущий Фрагмент можно найти по идентификатору контейнера в шаблоне главной Активити. В данном случае по: `R.id.fragment_container`
2. Проверяю, реализует ли класс интерфейс слушателя `OnBackButtonListener` и, если да, то вызываю непосредственно обработчик `onBackPressed`