---
layout: post
title: "Promise 활용"
description: "이런저런 사용법"
date: 2017-05-15
tags: [ ecmascript, javascript, promise ]
comments: true
share: true
image: 'images/brain.png'
thumbnail: 'images/brain.png'
categories: [ 'Tech', 'JavaScript', 'UI' ]
---

<!-- toc -->

# Promise 의 여러 사용법

개인적으로 유용하게 쓰고 있는 몇가지 방법을 소개한다.

## Timer 관련

### timeBomb

<script src="https://gist.github.com/javarouka/e076d7577412db859f5b0f8f69f9e29e.js"></script>

시한폭탄이다.

인자로 준 millisecond 후 폭발하며 reject 되는 promise 를 반환한다.

두번째 인자는 옵션인데 수행될 시점에 수행되는 함수를 전달한다. 이 함수가 true 를 반환하면 reject 되지 않는다.

```javascript
// 해체했나?!
const isMisFire = () => {
    return (Math.random() * 10).toFixed(0) % 2;
};

timeBomb(1000, isMisFire)
    .then(_=> console.log('Wow!'))
    .catch(_=> console.log('Pow!'));
```

### executeBeforeTimeout
                                           
수행된 비동기 작업이 fulfilled 될때까지 일정 시간동안 기다려보고 시간이 지나기 전에 실행하면 fulfilled, 아닐 경우 reject 한다

<script src="https://gist.github.com/javarouka/01ddc00cad091eba3575969f50f606b2.js"></script>

### 계속 업데이트 된다.
