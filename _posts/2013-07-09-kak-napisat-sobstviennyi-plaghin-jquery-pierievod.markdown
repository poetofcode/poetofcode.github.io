---
layout: post
title: "Как написать собственный плагин jQuery [перевод]"
date: 2013-07-09 23:57:17 +0400
comments: true
categories: 
---

<style>
	b {
		font-style: normal;
		font-weight: normal;
	}
</style>

<p>
	<b>Если вы никогда ранее не писали плагины для jQuery - не беда, чтобы сделать это требуется всего лишь несколько простых шагов. Следуя инструкциям, вы можете разработать плагин, который выглядит как нативный jQuery-метод.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Зачем создавать jQuery плагин?</span></b></p>
<p>
	<b>Вот список причин, для которых вам может потребоваться написать свой собственный плагин:</span></b></p>
<ul style="margin-top: 0pt; margin-bottom: 0pt;">
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Повторное использование снова и снова</span></b></li>
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Инкапсуляция</span></b></li>
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Простота использования</span></b></li>
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Поддержка цепочки вызовов</span></b></li>
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Возможность широкого распространения</span></b></li>
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Предотвращение конфликтов имен</span></b></li>
</ul>

<!-- more -->

<p>
	<br />
	<b>Из этого списка, я думаю, что одним из самых весомых причин является инкапсуляция вашего кода для повторного использования в вашем проекте. Плагины относительно легко писать, так что существует весьма немного причин удержать вас от того, чтоб сделать код более чистым и лекгим в поддерживании. В какой-то момент вы возможно захотите распространять свой плагин, что также неплохо, но организация вашего кода имеет наибольшее значение.</span><br />
	<br />
	<span>Если ни одна из этих причин не кажется вам весомой, то просто знайте, что написание собственных плагинов jQuery, а также их использование (и повторное использование) - это увлекательный и веселый процесс.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Как работает плагин jQuery</span></b></p>
<p>
	<b>Если говорить простыми словами, основные концепции jQuery плагина включают в себя следующее:</span></b></p>
<ul style="margin-top: 0pt; margin-bottom: 0pt;">
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Передача набора DOM элементов из jQuery выборки</span></b></li>
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Манипулирование DOM элементами</span></b></li>
	<li dir="ltr" style="list-style-type: disc; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Возврат объекта jQuery в цепочке вызовов</span></b></li>
</ul>
<p>
	<b>Перед тем как приступить к знакомству с этими разделами, вы должны создать основу для своего плагина.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Описание плагина</span></b></p>
<p>
	<b>Вот простой пример, с которого вы можете начать описание своего jQuery плагина.</span></b></p>
<pre class="prettyprint lang-js prettyprinted" style="font-family:monospace;">
$.fn.watermark = function(options) { /* ... */ } &nbsp;&nbsp;
//Ссылка на jQuery.prototype.watermark = function(options) { /* ... */ }
</pre>
<p>
	<b>Если вы взглянете на </span><a href="http://code.jquery.com/jquery-latest.js"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">исходный код jQuery</span></a><span>, то заметите, что </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">$.fn </span><span style="font-size: 15px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;">являете просто ссылкой на</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;"> </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">jQuery.prototype.</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;"> </span><span style="font-size: 15px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;">В предыдущем коде написано одно и то же, но использование короткой записи выглядит более предпочтительным.</span></b><br />
	<br />
	<b>Следующая проблема, которая встает перед нами - это запись $, которая может вызвать конфликт при использовании &nbsp;других библиотек JavaScript, которые вы возможно будете использовать. Одним из наиболее простых способов обойти эту проблему без потери в краткости кода и использовании jQuery вместо $ - это &nbsp;обернуть код вашего jQuery плагина в самовызываемую(self-invoking) анонимную функцию.</span><br />
	<br />
	<span>Чего?! Что это еще за самовызываемая анонимная функция? Ничего страшного, по сути, это функция без имени, которая вызывается немедленно. Таким образом, вы можете безопасно вызывать функцию с аргументом jQuery и $ в качестве принимающего параметра.</span><br />
	<br />
	<span>Наш модифицированный jQuery плагин после обертывания в самовызываемую анонимную функцию будет выглядеть так:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
(function($){ 
  $.fn.watermark = function(options) { ... } 
})(jQuery);
</pre>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Параметры плагина</span></b></p>
<p>
	<b>Наш следующий шаг - добавление некоторых параметров в плагин. Вы можете сделать это различными способами, но самым распространенным из тех, которые вы можете встретить, является передача одного параметра, который содержит все ваши опции внутри себя. Если вы последуете этому способу, то код будет выглядеть следующим образом:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
$(&#39;#helloWorld&#39;).watermark({
  text: &#39;City&#39;, 
  class: &#39;watermark&#39;
});
</pre>
<p>
	<b>Вместо того, чтобы просто сделать что-то вроде: </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">watermark(&quot;City&quot;, &quot;watermark&quot;), </span><span style="font-size: 15px; font-family: Arial; vertical-align: baseline; white-space: pre-wrap;">такая запись является самодокументируемой, определяя &ldquo;City&rdquo; в качестве text и &ldquo;watermark&rdquo; в качестве class.</span></b><br />
	<br />
	<b>Вы также должны позаботиться о наборе публичных открытых параметров плагина на случай, если пользователь не решит передавать все опции, которые необходимы для работы. Это обеспечивает поведение по-умолчанию, а также дает возможность пользователям перекрыть только те значения, которые они сочтут нужным.</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
$.fn.watermark.defaultOptions = {
  class: &#39;watermark&#39;,
  text: &#39;Введите текст&#39;
}
</pre>
<p>
	<b>Определив один раз значения по-умолчанию, вы можете по необходимости переопределить их снаружи jQuery плагина.</span></b><br />
	<br />
	<b>Если я хочу переопределить какое-либо значение для всех будущих экземпляров плагина, то я пишу код наподобие этого:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
$.fn.watermark.defaultOptions.class = &quot;watermark2&quot;;
$(&#39;#helloWorld&#39;).watermark();
$(&#39;#goodbyeWorld&#39;).watermark();
</pre>
<p>
	<b>Этот код использует класс </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;">watermark2</span><span> вместо </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;">watermark</span><span>, определенный в параметрах плагина по-умолчанию. Переопределенный класс использован тут в двух местах вызова плагина.</span></b><br />
	<br />
	<b>Теперь, когда мы имеем секцию определения параметров по-умолчанию, мы должны сфокусировать внимание на объединении параметров, переданных в jQuery плагин и опций по-умолчанию. Это довольно таки просто и может быть сделано с помощью одного их методов jQuery. Вот пример:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
(function($) {
 
  $.fn.watermark = function(options) {  
     options = $.extend({}, $.fn.watermark.defaultOptions, options);     
     return this;
  }
})(jQuery);
</pre>
<p>
	<b>В jQuery есть метод extend, который объединяет содержимое двух или более объектов и сохраняет результат в первом из них. В приведенном выше фрагменте кода мы объединили </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">$.fn.watermark.defaultOptions</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;"> </span><span>и</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;"> </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">options.</span><span> Первый объект является пустым, потому что мы не хотим изменять параметры по-умолчанию для будущих экземпляров плагина.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Обход jQuery выборки</span></b></p>
<p>
	<b>На данный момент наш плагин не делает ничего. Но теперь, когда &nbsp;у нас есть параметры по-умолчанию, объединенные с переданными параметрами, давайте соседоточимся на настройке нашего плагина для манипулирования DOM-элементами, выбранными при помощи jQuery.</span><br />
	<br />
	<span>Вполне вероятно, что селектор, используемый при инициализации плагина соответствует нулю, одному или большему числу DOM элементов:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
this.each(function() {  
  var element = $(this);  
  // Манипулируйте с элементом в этом месте...
}
</pre>
<p>
	<b>Ключевое слово this внутри метода each представляет один из DOM элементов из выборки. Показанный здесь код оборачивает DOM элемент в объект jQuery и сохраняет его для дальнейших манипуляций.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Публичные методы</span></b></p>
<p>
	<b>Другая распространенная техника состоит в открытии одного или нескольких методов, которые могут быть вызваны за пределами плагина. Чтобы определить публичные методы вы можете воспользоваться следующим кодом:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
(function($) {  
 $.fn.watermark = function(options) {  
 
   options = $.extend({}, $.fn.watermark.defaultOptions, options);
   
   this.each(function() {
     var element = $(this);
     // Манипулируйте элементом в этом месте...        
   });        
   
   return this;
 };
 
 // Публичная функция
 $.fn.watermark.greet = function(name) {
   console.log(Привет, &#39; + name + &#39;, добро пожаловать 
           на Script Junkies!&#39;);
 };
 
 $.fn.watermark.defaultOptions = {
   class: &#39;watermark&#39;,
   text: &#39;Введите текст&#39;
 }
})(jQuery);</pre>
<p>
	<b>Есть альтернативные способы реализовать публичные методы. Обычно подход, показанный выше, критикуют за то, что в нем используется больше чем одно имя Прототипа (Prototype) jQuery (</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">$.fn.watermark</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;"> </span><span>для плагина и</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;"> </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">$.fn.watermark.greet</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;"> </span><span>для публичного метода) и это засоряет пространство имен. Желательно использовать только одно имя Прототипа jQuery.</span></b><br />
	<br />
	<b>Вы можете увидеть, как некоторые авторы плагинов создают модуль с тем же названием что и плагин jQuery и инстанцируют объект для каждого DOM элемента. Затем объект сохраняется в виде элемента данных в каждом DOM элементе для вызова публичных методов в будущем.</span><br />
	<br />
	<span>Я переписал предыдущий пример, который загрезняет пространство имен jQuery ($.fn) двумя публичными методами и теперь использую вариант модуля, который определяет только один метод пространства имен jQuery. Вот измененный пример:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
(function($) {
 
  $.watermark = function(element, options) {
     this.options = {};
      
     element.data(&#39;watermark&#39;, this);
     
     this.init = function(element, options) {         
        this.options = $.extend({}, $.watermark.defaultOptions, options); 
     
        // Манипулируйте элементом...       
     };
     
     // Публичная функция
     this.greet = function(name) {
        console.log(&#39;Привет, &#39; + name + &#39;, добро пожаловать 
            на Script Junkies!&#39;);
     };
     
     this.init(element, options);
  };
 
  $.fn.watermark = function(options) { // Используется только одно имя $.fn  
     return this.each(function() {
        (new $.watermark($(this), options));              
     });        
  };
   
  $.watermark.defaultOptions = {
     class: &#39;watermark&#39;,
     text: &#39;Введите текст&#39;
  }
})(jQuery);
</pre>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 15px; font-family: Arial; background-color: transparent; font-weight: bold; vertical-align: baseline; white-space: pre-wrap;">Замечание:</span><span> я использую образец кода Модуля только в показательных целях для этого руководства. Я делаю это для того чтобы не засорять публичное пространство имен </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">jQuery.fn.</span><span> </span></b><br />
	<br />
	<b>Теперь, вызов публичного метода выглядит не так органично, как в предыдущем примере, засоряющем пространство имен jQuery. Вместо этого вы вызываете публичнй метод объекта </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">$.watermark</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;">, </span><span>который сохранен в вашем DOM элементе с помощью метода </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">data</span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;">.</span><br />
	<span>Вот пример:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
// Вместо этого...
$.fn.watermark.greet(&#39;Elijah&#39;); 
$(&#39;#firstName&#39;).watermark.greet(&#39;Elijah&#39;);  
 
// Теперь используйте...
$(&#39;#firstName&#39;).data(&#39;watermark&#39;).greet(&#39;Elijah&#39;);

</pre>
<p>
	<b>Вы можете подумать, что это не вам не подходит. Хорошо, есть и другая частоиспользуемая техника в стиле вызова публичных методов jQuery UI. В этой технике используется первый параметр плагина для вызова публичного метода. Следующи фрагмент кода демонстрирует вызов публичных методов виджета tabs:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
$(&#39;#tabs&#39;).tabs();
$(&#39;#tabs&#39;).tabs(&#39;add&#39;, &#39;./NewPage.html&#39;, &#39;New Tab&#39;);
</pre>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); vertical-align: baseline; white-space: pre-wrap;">Чтобы использовать такой тип синтаксиса для вызова публичных методов, вы можете использовать jQuery UI Widget Factory (Фабрику Виджетов), которую я вкратце затрону далее в этой статье.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Приватные функции</span></b></p>
<p>
	<b>В тех случаях, когда вы не хотите делать открытым весь ваш функционал, есть способы сделать ваши методы приватными. Основная техника - это объявление метода внутри самовызываемой анонимной функции, как показано тут:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
(function($) {
  $.watermark = function(element, options) {
     this.options = {};
      
     element.data(&#39;watermark&#39;, this);
     
     this.init = function(element, options) {         
           this.options = $.extend({}, $.watermark.defaultOptions, options); 
 
        // Вызов приватной функции
        updateElement(element, this.options);
     };
           
     // Публичная функция
     this.greet = function(name) {
        console.log(Привет, &#39; + name + &#39;, доро пожаловать 
                  на Script Junkies!&#39;);
     };
 
     this.init(element, options);
  };
 
 $.fn.watermark = function(options) {                   
   return this.each(function() {
      (new $.watermark($(this), options));              
   });        
 };
 
 // Приватная функция
 function updateElement(element, options) {
   // Манипулируйте элементом тут...   
 };
 
 $.watermark.defaultOptions = {
   class: &#39;watermark&#39;,
   text: &#39;Введите текст&#39;
 }
 
})(jQuery);</pre>
<p>
	<b>В зависимости от уровня юнит-тестирования, который вы захотите использовать вы можете захотеть сделать публичными больше ваших методов, что даст вам возможность протестировать больше методов по отдельности. В конце концов, это ваш выбор, но техника, которую я проиллюстрировал, должна помочь вам структурировать ваш код.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Поддержка метаданных плагина</span></b></p>
<p>
	<b>В настоящее время мы определили публичные параметры по-умолчанию, которые влияют на все будущие экземпляры плагинов. Мы также передавали произвольные опции в плагин, которые смешивались с параметрами по-умолчанию.</span><br />
	<br />
	<span>Если вы хотите, чтоб ваш плагин jQuery обладал настоящей гибкостью, то вы можете включить </span><a href="http://plugins.jquery.com/project/metadata"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">плагин Metadata</span></a><span> для переопределения параметров по-умолчанию на основе DOM-элемента. Плагин Metadata добавляет расширенную информацию в ваш DOM-элемент путем добавления JSON записи внутрь одного из атрибута вашего элемента. Распространенной техникой является использование атрибута class (который я покажу), но вы можете также использовать атрибут data, как показано здесь:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
&lt;input id=&quot;state&quot; type=&quot;text&quot; class=&quot;someclass {text: &#39;State&#39;}&quot; /&gt;
&lt;input id=&quot;zip&quot; type=&quot;text&quot; data=&quot;{text: &#39;Zip&#39;, class: &#39;watermark&#39;}&quot; /&gt;
</pre>
<p>
	<b>Теперь давайте обновим наш jQuery плагин и добавим поддержку метаданных. Следующий код сначала проверяет наличие плагина Metadata. Если да, то в опции добавляются все параметры, переданные в метаданных элемента.</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
this.init = function(element, options) {         
  this.options = $.extend({}, $.watermark.defaultOptions, options);
 
  // Если метаданные плагина существуют, то добавляется информация
  // из метаданных в параметры
  this.options = $.metadata ? 
     $.extend({}, this.options, element.metadata()) : 
     this.options;
 
  updateElement(element, this.options);
};
</pre>
<p>
	<b>Теперь вы можете использовать следующий синтаксис, чтобы переопределить параметры по-умолчанию или параметры переданные плагину jQuery.</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
&lt;input id=&quot;helloWorld&quot; 
  type=&quot;text&quot; 
  class=&quot;{text: &#39;Watermark присутствует здесь вместо аргумента плагина&#39;, 
     class: &#39;specialWatermarkClass&#39;}&quot; /&gt;
</pre>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Реализация цепочки вызовов</span></b></p>
<p>
	<b>В большинстве jQuery функций и плагинов желательно возвращать объект jQuery, чтобы обеспечить работу вызовов методов по цепочке. Реализовать это довольно просто. Наиболее распространенный способ сделать это - возвратить метод </span><span style="font-size: 13px; font-family: Verdana; color: rgb(51, 51, 51); font-style: italic; vertical-align: baseline; white-space: pre-wrap;">$.each, </span><span>как показано тут:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
$.fn.watermark = function(options) {                   
  return this.each(function() { // Поддержка цепочки вызовов
     (new $.watermark($(this), options));              
  });        
};
</pre>
<p>
	<b>Это незначительно изменение в вашем плагине, позволяет вам вызывать плагин в следующей форме:</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
$(&#39;#helloWorld&#39;).watermark({text: &#39;Last Name&#39;}).css({
  border-color: &#39;red&#39;;
});
</pre>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Модульное тестирование</span></b></p>
<p>
	<b>Было бы не лишним написать модульные тесты для вашего плагина, чтобы обеспечить первозданное качество и быть уверенным в его работоспособности, а также немедленно выявлять критические ошибки в случае внесения новой функциональности или при изменении &nbsp;существующего кода.</span><br />
	<br />
	<span>Я не буду вдаваться в подробности при описании </span><a href="http://docs.jquery.com/QUnit"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">QUnit</span></a><span>. Если вы хотите узнать больше о том, как начать работу с ним, то вы можете получить подробную документацию на сайте jQuery.com и там же скачать необходимые файлы.</span><br />
	<br />
	<span>Чтобы протестировать функциональность нашего плагина watermark, я написал несколько модульных тестов. Для краткости, я приведу только один модуль и два юнит-теста в этой статье. Если вам интересно просмотреть или самому запустить другие тесты, то их исходники доступны в моем </span><a href="http://github.com/elijahmanor/jWatermark"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">репозитории jWatermark на GitHub&#39;е</span></a><span>.</span><br />
	<br />
	<span>Следующий код описывает главный модуль, который я использую для тестирования нашего плагина watermark. Поскольку мы хотим сделать наши тесты автономными и воспроизводимыми, я определил методы setup и teardown, которые вызываются перед и после каждым юнит тестом соответственно, таким образом, наше окружение остается одинаковым для каждого теста.</span><br />
	<br />
	<span>Мой метод setup сбрасывает параметры по-умолчанию к значениям, с которыми плагин был инициализирован при первом инстанцировании. Причина, по которой я делаю это, заключается в том, что некоторые мои юнит тесты будут перезаписывать параметры по-умолчанию, но я не хочу, чтоб это повлияло на другие тесты.</span><br />
	<br />
	<span>Я определил пустой div, чтобы инициализировать плагин watermark. Метод teardown в основном очищает содержимое тестового элемента для использования в следующем тесте.</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
var playGroundSelector = &quot;#qunit-playground&quot;;
module(&quot;Watermark jQuery Plugin&quot;, {
 setup: function() {
   $.watermark.defaultOptions = {
     class: &#39;watermark&#39;,
     text: &#39;Введите текст здесь&#39;
   }    
 },
 teardown: function() {
   $(playGroundSelector).empty();
 }
});
</pre>
<p>
	<b>Юнит тесты обычно разбивают на три части:</span></b></p>
<ol style="margin-top: 0pt; margin-bottom: 0pt;">
	<li dir="ltr" style="list-style-type: decimal; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">секция настройки, в которой устанавливаются все необходимые части для запуска теста</span></b></li>
	<li dir="ltr" style="list-style-type: decimal; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">секция действия, в которой выполняется сам интересующий нас тест</span></b></li>
	<li dir="ltr" style="list-style-type: decimal; font-size: 15px; font-family: Arial; background-color: transparent; vertical-align: baseline;">
		<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">секция проверки, которая проверяет результат выполнения теста</span></b></li>
</ol>
<p>
	<b>Поскольку некоторые из вас могут быть не знакомы с юнит-тестами, я буду сопровождать эти разделы комментариями.</span></b><br />
	<br />
	<b>Мой первый юнит тест очень прост. Все что он делает - просто убеждается, что плагин watermark, инстанцированный без аргументов имеет парметры class и text, совпадающие с параметрами по-умолчанию.</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
test(&quot;Watermark Без Параметров&quot;, function() {
 // Настройка
 var testBox =
     $(&quot;&lt;input id=&#39;testBox&#39; type=&#39;text&#39; /&gt;&quot;)
         .appendTo(playGroundSelector);
 
 // Действия
 testBox.watermark();
 
 // Проверка
 expect(2);
 deepEqual(testBox.attr(&quot;class&quot;), &quot;watermark&quot;, 
     &quot;Класс должен быть определен&quot;);
 deepEqual(testBox.val(), &quot;Введите текст здесь &quot;, 
     &quot;Значение watermark должно быть задано по-умолчанию&quot;);
});
</pre>
<p>
	<b>Вот другой пример юнит теста, который обеспечивает, что watermark очищается, когда текстовое поле получает фокус.</span></b></p>
<pre class="prettyprint lang-js prettyprinted">
test(&quot;Watermark Должен Очищаться При Получении Фокуса&quot;, function() {
 // Настройка
 var testBox =
     $(&quot;&lt;input id=&#39;testBox&#39; type=&#39;text&#39; /&gt;&quot;)
         .appendTo(playGroundSelector);
 
 // Действия
 testBox.watermark({
   text: &#39;Введите текст здесь 4&#39;,
   class: &#39;watermark5&#39;
 }).focus();
 
 // Проверка
 expect(2);
 ok(!testBox.hasClass(&quot;watermark5&quot;), &quot;Не должен иметь класс watermark5&quot;);
 deepEqual(testBox.val(), &quot;&quot;, &quot;Значение Watermark должно быть пустым&quot;);
});
</pre>
<p>
	<b>Как я упоминал ранее, вы можете написать другие тесты, но я хотел показать только пару тестов, чтобы дать &nbsp;вам представление о том, что вы можете сделать. И снова я призываю вас писать юнит тесты для вашего кода jQuery. Они помогут сохранить модульность вашего кода, помогут сохранить качество во время рефакторинга и позволят вам расширять ваш код с уверенностью, что предыдущий код не был нарушен.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Виджеты jQuery UI</span></b></p>
<p>
	<b>Как только вы научитесь написанию собственных плагинов jQuery возможно вы захотите освоить написание собственных </span><a href="http://docs.jquery.com/UI_Developer_Guide#The_widget_factory"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">виджетов jQuery</span></a><span>. Главное отличие между ними состоит в том, что виджет поддерживает состояние, в то время как обычный плагин обычно нет.</span><br />
	<br />
	<span>Команда jQuery UI создала Widget Factory (Фабрику Виджетов), чтобы сделать написание вашего виджета быстрым и простым. Великолепный ресурс для ускорения создания виджета jQuery UI - это недавний пост блога </span><a href="http://twitter.com/danwellman"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Dan Wellman</span><span style="font-size: 15px; font-family: Arial; color: rgb(0, 0, 0); background-color: transparent; text-decoration: initial; vertical-align: baseline; white-space: pre-wrap;"> </span></a><span>озаглавленная как </span><a href="http://net.tutsplus.com/tutorials/javascript-ajax/coding-your-first-jquery-ui-plugin/?utm_source=feedburner"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Написание вашего первого плагина jQuery UI</span></a><span>. На самом деле, все существующие виджеты UI JQuery используют Widget Factory, таким образом, они также являются отличным источником примеров для исследования и изучения.</span></b></p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><span style="font-size: 19px; font-family: Arial; background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Заключение</span></b></p>
<p>
	<b>Я надеюсь, что эта статья позволила вам хорошо прочувствовать основные этапы создания подходящего для многоразового применения плагина jQuery. Если вы ищете шаблон, чтобы сразу приступить к созданию плагина jQuery, то я предложил бы использовать </span><a href="http://starter.pixelgraphics.us/"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Starter: Jumpstart Your jQuery Plugin template</span></a><span>. Он содержит много понятий, которые я описал в этой статье, и может предоставить вам хорошую отправную точку для создания собственного плагина JQuery.</span><br />
	<br />
	<span>Если вы заинтересованы в дальнейшем изучении jQuery, то вы можете </span><a href="http://twitter.com/elijahmanor"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">подписаться на мой Твиттер</span></a><span> для получение свежих новостей в мире jQuery. Также проверяйте мой блог на наличие моих ежедневных обзоров </span><a href="http://webdevtweets.blogspot.com/"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">Tech Tweets</span></a><span>, которые содержат многочисленные ссылки о jQuery для помощи в вашем учебном процессе.</span></b></p>
<p>
	&nbsp;</p>
<p>
	<b id="internal-source-marker_0.7454807010944933" style="color: rgb(0, 0, 0); font-family: 'Times New Roman'; font-size: medium; font-weight: normal;"><em><span>Подготовлено по материалам источника: </span></em><a href="http://msdn.microsoft.com/en-us/magazine/ff608209.aspx"><span style="font-size: 15px; font-family: Arial; color: rgb(17, 85, 204); background-color: transparent; vertical-align: baseline; white-space: pre-wrap;">http://msdn.microsoft.com/en-us/magazine/ff608209.aspx</span></a></b></p>
