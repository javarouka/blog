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

> 이 포스트의 예제 코드는 ES6 으로 작성되었습니다.

## 뒤돌아보기

전 포스트들에서 비동기의 대략적 흐름과 Promise 의 기본 동작에 대해 다루다가 잠깐 언급한 내용이 있다. Timer 와 Promise 를 비교하면서 Timer 함수보다 Promise 가 더 우선권이 있다고 했었다.

실제로 Promise 다른 javascript 일반적인 비동기 수행보다 앞선 비동기적 우선권을 가진다. 이것에 대해 이해하려면 HTML Living Standard 에 새로 추가된 Micro Task 에 대해 좀 더 알 필요가 있다.

`Task` 와 `MicroTask` 에 대해 자세히 알아보자

## Task

Event Loop 는 하나 혹은 그 이상의 Task Queue 라는 부르는 Task 가 순서대로 정렬된 List 를 가진다. 

Task 는 다음과 같은 여러 작업들의 모음이다.

- 스크립트 실행
- 이벤트
- HTML 파싱
- 콜백
- Fetch, Ajax
- DOM 조작

javascript 를 실행하는 것도 태스크, HTML 파싱, Timer, DOM 조작 등이 전부 Task 이다.

javascript 가 코드 블럭을 수행하면 call stack 에 함수 호출을 쌓으며 실행해나가는 Task 를 수행하고, 도중 Ajax, DOM 조작을 만나면 Task Queue 에 넣고 계속 루프 작업을 진행하게 된다. 타이머를 만나면 바로 Task Queue 에 추가되지 않고 지정된 시간 후 Task Queue 에 추가된다.

삽입된 Task 는 다음 Event Loop, 혹은 지정된 시간, 이벤트 트리거에 의해 다시 수행된다.

[비동기와 Promise #1](/blog/2016/11/08/javascript-async-promise-1/) 에서 다뤘듯 특별할게 없는 동작이다.

## Micro Task

Micro Task 는 새로운 Task 로서 기존의 Task 에 영향을 받지 않고 Async 로 빠르게 수행되는 Task 들이다.

- [process.nextTick](https://blog.outsider.ne.kr/739)
- [Promise](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Object.observe](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/observe)
- [MutationObserver](https://developer.mozilla.org/ko/docs/Web/API/MutationObserver)

Micro Task 는 현재 실행중인 Task 의 실행이 종료된 뒤 바로 다음에 일어날 일들이 쌓이는 곳이다.

일반적인 구현으로는 각 Task 가 끝나거나, Event Loop 의 시작과 끝에서 체크된다. 이 작업을 표준 문서에서는 Micro Task checkpoint 라고 정의하고 있다.

Task 의 종료와 루프의 시작과 끝에서 수행되기에 일반적인 Task 의 실행이 다음 루프에서 처리되는 것보다 우선권이 있다.

HTML 스펙의 [Micro Task checkpoint - perform a microtask checkpoint](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint) 의 설명을 대략 요약하면 다음과 같다.

중간에 여러 개념들이 등장하지만, Micro Task 에 초점을 맞춰 요약해보면 다음과 같은 흐름이다.

1. `Micro Task checkpoint` 수행
2. 핸들링 : 이벤트 루프의 Micro Task 큐가 비어 있으면 완료 단계로
3. Event Loop 의 Micro Task 큐 대기열에서 가장 오래된 Micro Task 를 선택
4. Event Loop 의 현재 실행중인 작업 을 3번 단계에서 선택한 작업으로 설정
5. 실행 : 선택한 Task 를 실행.
6. Event Loop 의 현재 실행중인 작업을 null 로 설정
7. 위의 단계에서 실행 된 Micro Task 를 큐에서 제거하고 Micro Task 큐 처리 단계 (2번 단계) 로
8. 완료 : `Micro Task checkpoint` 완료

아래는 위의 흐름을 개념적 코드로 표현해보았다. (실제 구현이 이렇다는건 절대 아니다)

```javascript
function performMicroTaskCheckPoint(eventLoop) {

    // 재진입성(reentrant invocation) 방지를 위한 플래그 프로퍼티
    // http://sunyzero.tistory.com/97    
    while(eventLoop.microCheckPointFlag) {
    
        if(eventLoop.microTaskQueue.length < 1) { // 2
            eventLoop.microCheckPointFlag = false;
            break;
        }
        
        const microTask = eventLoop.microTaskQueue.shift(); // 3
        
        eventLoop.setCurrentRunngingTask(microTask); // 4
        eventLoop.executeCurrentTask(); // 5
        eventLoop.setCurrentRunngingTask(null); // 6
    }
}
```

여기서 알 수 있는건 Micro Task 큐가 비어있지 않다면 Task 가 비어있을 때까지 무한히 핸들링 -> 실행 단계를 반복하도록 되어 있다는 점이다.

만일 Micro Task 에서 다른 MicroTask 를 등록하는 작업을 반복하면 다음의 이벤트 루프는 수행되지 못할 수도 있다는 뜻이다.

### Micro Task 과다 중첩 예제

테스트 코드로 알아보자. 사용할 Micro Task 는 이 시리즈에서 한창 다루는 Promise 를 사용한 예제이다.

먼저 사용할 함수 두개를 만들자

```javascript
// Promise 를 받아 상태값에 1을 증가시키고,
// resolved Promise 를 반환하는 함수
const doIncrementChain = promise => {
    return promise.then(val => {
        console.log('Promise value', val);
        return Promise.resolve(++val)
    });
};

// 제일 빠르게 수행되는 Timer 를 예약하는 함수
const putImmidiateTimer = fn => {
  setTimeout(fn, 0);
};
```

위 두 함수를 사용해서 예제 코드는 다음과 같다.

```javascript
// Timer 를 예약한다.
putImmidiateTimer(_=> console.log('I am Timer!'));

// Promise 생성
let promise = new Promise(resolve => {
    console.group('promise start~');
    return resolve(1);
});

// loopCount 만큼 순회하며 Promise 를 연결한다.
let loopCount = 100000;
while(loopCount--) promise = doIncrementChain(promise);

// 완료되면 완료로깅을 출력하는 Promise를 연결한다.
promise.then(_=> console.groupEnd('promise executed!'));
```

이 코드는 위의 스펙대로 모든 Promise 가 추가한 MicroTask 를 전부 소비하고 난 뒤에야 타이머 작업이 시작된다.

혹 사양이 낮은 PC나 환경에 따라서는 PC가 멈추거나 오류를 낼 수 있다.(NodeJS 의 경우 아마 1000 번의 Micro Task 큐 작업이 한계라고 알고 있다)

이 블로그를 작성중인 작업 컴퓨터의 사양이 좀 낮은 관계로 10번만 수행시켰다. (Chrome 브라우저 콘솔)

![10번 수행 결과. Timer 가 Micro Task 에 밀려 제일 늦게 수행된다](/blog/images/promise/P_T.png)

실행 결과를 보았듯이 Timer 작업은 앞선 Micro Task 인 Promise 에 밀려 제일 나중에 실행된다.

루프 카운트를 10000 으로 늘려도 결과는 같다.(다만 과하게 늘릴 경우 수행이 늦어지거나 엔진 다운이 있을 수 있다.)

## 결론

비동기 및 Promise 포스팅이 이걸로 끝났다.

비동기에 대해서는 여기 써놓은 내용 이상으로 다룰 내용이 너무 깊고 많다. 노오력이 부족한 관계로 새로운 사실을 알게 될 때마다 포스트를 수정해나갈 생각이다.

## 참고
- [비동기와 Promise 1](/blog/2016/11/08/javascript-async-promise-1/) 
- [비동기와 Promise 2](/blog/2016/11/09/javascript-async-promise-2/) 
- [비동기와 Promise 3](/blog/2016/11/12/javascript-async-promise-3/) 
- [C언어:reentrant (재진입성) 함수와 쓰레드안전(MultiThread-safe)](http://sunyzero.tistory.com/97)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 1](http://www.bsidesoft.com/?p=399)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 2](http://www.bsidesoft.com/?p=414)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 3](http://www.bsidesoft.com/?p=423)
- [NHN Enter # 자바스크립트와 이벤트 루프](https://github.com/nhnent/fe.javascript/wiki/June-13-June-17,-2016)
- [2ality # ECMAScript 6 promises - foundations](http://www.2ality.com/2014/09/es6-promises-foundations.html)
- [jakearchibald's blog # Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules)
