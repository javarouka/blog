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

## Task vs Micro Task

전 포스트에서는 비동기의 대략적 흐름과 Promise 의 기본 동작에 대해 말해보았다.

그리고 포스트 중간에 Timer 와 간단히 비교해봤는데, Timer 함수보다 Promise 가 더 우선권이 있다고 했었다.

ES6 에 새로 추가된 Micro Task 는 기존의 Task Queue 가 아닌 Micro Task 로 관리된다.

먼저 Task 와 MicroTask 에 대해 자세히 알아보자

### Task

### MicroTask

그리고 Micro Task 는 기존의 Task 보다 실행 우선권이 존재한다.

HTML 스펙의 [perform a microtask checkpoint](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint) 의 설명을 보자

사용자 에이전트가 마이크로 태스 크 체크 포인트를 수행 할 때, 마이크로 태스 크 체크 포인트 플래그를 수행하는 것이 거짓이면 사용자 에이전트는 다음 단계를 실행해야한다.

마이크로 태스크 체크 포인트 플래그를 수행하도록하십시오.

마이크로 프로세스 대기열 처리 : 이벤트 루프의 마이크로 태스크 대기열이 비어 있으면 아래의 완료 단계로 건너 뜁니다.

이벤트 루프의 마이크로 태스크 대기열에서 가장 오래된 마이크로 태스크를 선택하십시오.

이벤트 루프의 현재 실행중인 작업을 이전 단계에서 선택한 작업으로 설정하십시오.

실행 : 선택한 작업을 실행합니다.

이것은 스크립팅 된 콜백을 호출하는 것을 포함 할 수 있습니다. 스크립트 콜백을 호출하면 스크립트 단계를 실행 한 후 정리를 호출합니다.이 스크립트는 다시 마이크로 체크 포인트 알고리즘을 수행합니다.이 때문에 마이크로 타워 검사 점 플래그를 사용하여 재진입을 방지합니다.

이벤트 루프의 현재 실행중인 작업을 다시 null로 설정하십시오.

마이크로 스텝 대기열에서 위의 단계에서 실행 된 마이크로 작업을 제거하고 마이크로 작업 대기열 처리 단계로 돌아갑니다.

완료 : 해당 이벤트 루프가 해당 이벤트 루프 인 각 환경 설정 개체에 대해 해당 환경 설정 개체의 거부 된 약속을 알립니다.

마이크로 태스크 체크 포인트 플래그를 수행하도록합니다.

```

```

## 결론
