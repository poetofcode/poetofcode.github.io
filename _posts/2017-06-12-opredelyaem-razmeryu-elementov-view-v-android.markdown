---
layout: post
title: "Определяем размеры элементов View в Android"
date: 2017-06-12 16:00:00 +0300
comments: true
category: coding
tags: android programming
image: android_sizes.png
---

Размер View становится известным только после того как отработает View.onMeasure(), до этого он неизвестен, поскольку зависит от тучи факторов: соседние вьюшки, родители, размеры экрана и проч. проч. - так что размер замеряйте после или во время отработки View.onMeasure(). Вот что говорит мануал.