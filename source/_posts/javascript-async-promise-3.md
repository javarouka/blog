---
layout: post
title: "비동기와 Promise #3"
description: "JavaScript 의 비동기와 Promise 에 대해 알아보자"
date: 2016-11-12
tags: [ecmascript, javascript, promise, async]
comments: true
share: true
image: 'images/brain.png'
thumbnail: 'images/brain.png'
categories: ['Tech', 'JavaScript', 'Async']
---

<!-- toc -->

[전 포스트](/blog/2016/11/09/javascript-async-promise-2/) 에 이은 글이다.

## 복습

전 포스트들에서 비동기의 대략적 흐름과 Promise 의 기본 동작에 대해 다루다가 잠깐 언급한 내용이 있다. Timer 와 Promis를 비교하면서 Timer 함수보다 Promise 가 더 우선권이 있다고 했었다.

실제로 Promise 다른 javascript 일반적인 비동기 수행보다 앞선 비동기적 우선권을 가진다. 이것에 대해 이해하려면 ES6 에 새로 추가된 Micro Task 에 대해 좀 더 알 필요가 있다.

`Task` 와 `MicroTask` 에 대해 자세히 알아보자

## Task

Event Loop 는 하나 혹은 그 이상의 Task Queue를 가진다. 이것은 Task 라고 부르는 작업이 순서대로 정렬된 List 이다. 여기서 말하는 Task 는 다음과 같은 여러 작업들의 모음이다.

- 이벤트
- HTML 파싱
- 콜백
- Fetch, Ajax
- DOM 조작

javascript 를 실행하는 것도 태스크, HTML 파싱, Timer, DOM 조작 등이 전부 Task 이다.

javascript 가 코드 블럭을 수행하면 call stack 에 함수 호출을 쌓으며 실행해나가는 Task 를 수행하고, 도중 Ajax, DOM 조작을 만나면 Task Queue 에 넣고 계속 루프 작업을 진행하게 된다. 타이머를 만나면 바로 Task Queue 에 추가되지 않고 지정된 시간 후 Task Queue 에 추가된다.

삽입된 Task 는 다음 Event Loop, 혹은 지정된 시간, 이벤트 트리거에 의해 다시 수행된다.

1번 글에서 다뤘듯 특별할게 없는 동작이다.

## MicroTask

Micro Task 는 새로운 Task 로서 기존의 Task 에 영향을 받지 않고 비동기저으로 빠르게 수행되는 Task 들이다.

- [process.nextTick](https://blog.outsider.ne.kr/739)
- Promise
- [Object.observe](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/observe)
- [MutationObserver](https://developer.mozilla.org/ko/docs/Web/API/MutationObserver)

Micro Task 는 기존의 Task 보다 실행 우선권이 존재한다.

HTML 스펙의 [Micro Task 체크포인트 - perform a microtask checkpoint](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint) 의 설명을 대략 요약하면 다음과 같다.

중간에 여러 개념들이 등장하지만, Micro Task 에 초점을 맞춰 요약해보면 다음과 같은 흐름이다.

1. Micro Task 체크포인트 실행
2. 핸들링 : 이벤트 루프의 Micro Task 큐가 비어 있으면 완료 단계로
3. Event Loop 의 Micro Task 큐 대기열에서 가장 오래된 Micro Task 를 선택
4. Event Loop 의 현재 실행중인 작업 을 4번 단계에서 선택한 작업으로 설정
5. 실행 : 선택한 Task 를 실행.
6. Event Loop 의 현재 실행중인 작업을 null 로 설정
7. 위의 단계에서 실행 된 Micro Task 를 큐에서 제거하고 Micro Task 큐 처리 단계 (2번 단계) 로
8. 완료 : Micro Task 체크포인트 완료, 이벤트 루프 재개.

여기서 알 수 있는건 Micro Task 큐가 비어있지 않다면 빌 때까지 무한히 핸들링 -> 실행 단계를 반복하도록 되어 있다는 점이다.

만일 Micro Task 에서 다른 MicroTask 를 등록하는 작업을 반복하면 다름 이벤트 루프는 수행되지 못할 수도 있다는 뜻이다.

### Micoro Task 과다 중첩 예제

테스트 코드로 알아보자. Micro Task 이자 이 시리즈에서 한창 다루는 Promise를 사용한 예제이다.

> 예제 코드는 ES6 으로 작성되었다.

```javascript
// Promise 를 받아 상태값에 1을 증가시키고,
// resolved Promise 를 반환하는 함수
const chain = promise => {
    return promise.then(val => {
        console.log('Promise value', val);
        return Promise.resolve(++val)
    });
};

// 제일 빠르게 수행되는 Timer 를 예약하는 함수
const immidiateTimer = fn => {
  setTimeout(fn, 0);
};

// Timer 를 예약한다.
immidiateTimer(_=> console.log('I am Timer!'));

// Promise 생성
let promise = new Promise(resolve => {
    console.group('promise start~');
    return resolve(1);
});

// 루프카운트만큼 순회하며 Promise 를 연결한다.
let loopCount = 100000;
while(loopCount--) promise = chain(promise);

// 완료되면 완료로깅을 출력하는 Promise를 연결한다.
promise.then(_=> console.groupEnd('promise executed!'));
```

이 코드는 위의 스펙대로 모든 Promise 가 추가한 MicroTask 를 전부 소비하고 난 뒤에야 타이머 작업이 시작된다.

혹 사양이 낮은 PC나 환경에 따라서는 PC가 멈추거나 오류를 낼 수 있다.(NodeJS 의 경우 아마 1000 번의 Micro Task 큐 작업이 한계라고 알고 있다)

## 결론

블라블라앗살라무알레이꿈 작성중이라네...
