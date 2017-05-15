---
layout: post
title: "Promise 활용"
description: "이런저런 사용법"
date: 2017-05-15
tags: [ ecmascript, javascript, promise, async ]
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

만일 더 개선하고 싶다면 취소함수를 `promise` 등으로 바꿔버리는 것도 괜찮을듯. 판단 함수까지 비동기로.

이 경우 `isThenable` 등의 함수가 추가로 구현되어야 한다. 예를 들면 다음과 같다.

<script src="https://gist.github.com/javarouka/b48edaa30a7a44f533fe49e73f310658.js"></script>

### executeBeforeTimeout
                                           
수행된 비동기 작업이 `fulfilled` 될때까지 일정 시간동안 기다려보고 시간이 지나기 전에 실행하면 `fulfilled`, 아닐 경우 `reject` 한다

<script src="https://gist.github.com/javarouka/01ddc00cad091eba3575969f50f606b2.js"></script>

```javascript
// 2초 내 응답이 올까?
executeBeforeTimeout(requestAsync('/hello'), 2000)
    .then(_=> console.log('OK!'))
    .catch(_=> console.log('Timeout!'));
```

## Resolve 관련

### select 형 resolve

일회성의 이벤트를 비동기 Thenable 스타일로 작성할 수 있게 한다

다음과 같은 코드 스타일이다.

```javascript
somedayHappenAction()
    .then(result => console.log(`완료! ${result}`));
```

## Collection 관련

### Promise.map

thenable 들의 결과들을 map 하여 반환하게 한다

### Promise.always

thenable 이 reject 되도 항상 then 으로 연결되게 한다

## 계속 업데이트 된다.
