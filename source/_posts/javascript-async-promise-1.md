---
layout: post
title: "비동기와 Promise #1"
description: "JavaScript 의 비동기와 Promise 에 대해 알아보자"
date: 2016-11-08
tags: [ecmascript, javascript, promise, async]
comments: true
share: true
image: 'images/brain.png'
thumbnail: 'images/brain.png'
categories: ['Tech', 'JavaScript', 'Async']
---

## Run to Completion

다음 `Java Code` 가 있다.

어떤 웹 서버 프로그램에서 모듈의 사용 횟수를 카운팅하는 프로그램이다.

```java
public class UserStore {

    private long count = 0L;

    @Resource
    private UserProvider provider;

    public User findUser(String id) {
        final User found = provider.getById(id);
        count++;
        return found;
    }
}
```

모듈 호출시마다 사용 카운트 변수 `count` 를 1씩 증가시킨다. 언뜻 잘 동작할듯 싶지만 이 코드는 잘못된 통계를 내놓는다.

`count++` 는 한줄로 써 있어 단일연산인 것처럼 보이지만, 실제로는

- count 값을 가져온다
- 1을 더한다
- count 에 다시 할당한다

라는 3단계의 작업이다.

다수의 요청 스레드가 저 메서드를 호출할 경우 한 스레드는 count 값을 가져온 상태에서 다른 스레드가 이미 값을 갱신한 상태가 될 수도 있다.

최신의 값을 반영하지 못한 상태에서 여러 스레드가 값을 갱신하기 시작하면 결국 저 count 는 실제 콜 횟수와는 다른 값을 보여줄 것이다.

하지만 JavaScript 에선 이런 일이 일어나지 않는다.

JavaScript 의 코드는 항상 `실행-완료 (Run-to-completion)` 을 보장하는데, 이 뜻은 JavaScript 는 코드가 해석되고 수행될 때는 다른 코드의 실행이 되지 않는다는 실행 방식을 말한다.

일반적인 방법으로는 한번에 수행되는 함수 코드 사이에 다른 작업이 개입할 수 없다. 실행할 코드가 있다면 어떤 일이 있든 전부 실행부터 실행 완료까지 되는 것이다.

위 코드를 javascript 로 쓰면 이렇다

```Javascript
(function(exports) {

    var count = 0;
    var userProvider = require('userProvider');

    function findUser(id) {
        var found = userProvider.findUser(id);
        count++;
        return found;
    }

    exports.userStore = {
        findUser: findUser
    };

})(someModuleSystem);
```

위 코드에서는 여러 타이머나 이벤트 등의 비동기성을 띈 코드에서 이 모듈의 `findUser` 를 호출해도 완벽하게 이 모듈의 콜 카운트를 보장할 것이다.

`Run-to-completion` 을 보장하려면 어떤 코드를 한번 동작하기 시작하면 다른 작업은 멈춰야 한다. 실제로, javascript 는 그렇게 동작한다.

다음 코드를 보자

```javascript
function workShortTime() {
    var i = 10
    while(i--) {}
    console.log('workShortTime complete')
}

function workLongTime() {
    var elapsed = (+new Date) + (1000 * 2);
    while((+new Date) < elapsed) {}
    console.log('workLongTime complete')
}

function work() {
    setTimeout(workShortTime, 1);
    workLongTime();
}
```

setTimeout 으로 1 밀리세컨드 정도만 대기한 뒤에 `workShortTime` 를 수행하게 하고 다음 `workLongTime` 을 수행한다. 하지만 1 밀리세컨드가 지났다고 해도 `workLongTime` 이 끝나지 않는 한 `workLongTime` 을 중단하고 `workShortTime` 가 먼저 실행되진 않는다.

2초 뒤 `workLongTime` 가 끝난 다음에야 `workShortTime` 이 수행될 것이다.
(실제 느린 PC 에서 이 코드를 브라우저가 화면을 그리고 있을때나, NodeJS 서버가 요청을 처리하는 도중 수행시키면 이 코드가 끝날 때까지 화면을 더이상 그리지 않고, NodeJS 서버라면 아무런 동작을 하지 않을 것이다.)


## javascript 의 동작 도구들

### Call Stack

보통 프로그래밍 언어에서는 함수가 호출될 경우 함수들은 *자신을 호출한 곳으로 되돌아갈 곳* 을 알아야 한다. 이 정보는 대부분 stack 으로 관리된다.

> Java 프로그래머라면 이 정보를 보기 위한 Exception::printStacktrace 에 익숙할 것이다

JavaScript 도 타 언어와 비슷한 `Call Stack` 이라는 게 존재하고, 메서드 수행 시마다 Stack 에 입력한 뒤 순차적으로 스택을 비워가며 실행한다.
스택이 다 비워질 경우 종료된다.

다음 코드를 보자. 먼저 스택을 보기 위한 코드부터 만들자.

```javascript
// stacktrace 함수
function stacktrace() {
    try {
        throw new Error();
    }
    catch(ex) {
        // Error 구문을 지우기 위한 코드
        console.log(ex.stack.split('\n').slice(1).join('\n'));
    }
}
```

이제 코드

```javascript
function stepA() {
    stepB();
}
function stepB() {
    stepC();
}
function stepC() {
    stacktrace();
    console.log("complete!")
}

console.log('시작합니다.', stacktrace())

stepA();
```

콘솔창에서 실행한다고 가정할 때 결과는 대충 아래와 같은 모습이다.

```
  at stacktrace (<anonymous>:3:15)
  at <anonymous>:12:23
시작합니다. undefined
  at stacktrace (<anonymous>:3:15)
  at stepC (<anonymous>:8:5)
  at stepB (<anonymous>:5:5)
  at stepA (<anonymous>:2:5)
  at <anonymous>:14:1
complete!
```

제일 처음에는 호출 스택에는 아무것도 없다. 코드가 실행되면 그때 call stack 에 실행중인 함수(첫 코드 실행시에는 `runScript` 라고 하자) 가 삽입된다.

```javascript
stack = [ runScript ]
```

첫 코드 실행후 만나는 함수(메서드)는 `stacktrace` 다. 이 함수가 실행되는 시점의 스택은

```javascript
stack = [ runScript, stacktrace ]
```

이다.

그리고 stacktrace 함수가 종료되면서 stacktrace 는 제거되고 다시 `console.log` 가 실행된다. 그 시점의 스택은 이렇다.

콘솔에는 다음과 같이 찍힐 것이다.

```
at stacktrace (<anonymous>:3:15)
at <anonymous>:12:23
```

```javascript
stack = [ runScript, console.log ]
```

그 다음 `console.log` 실행이 끝나고 콘솔에는 `시작합니다 undefined` 가 찍힌다. 그리고 스택은 다시 비워져 `runScript` 만 남는다.

```javascript
stack = [ runScript ]
```

그 다음에는  `stepA` 함수가 실행되며 스택은 다음과 같다.

```javascript
stack = [ runScript, stepA ]
```

그 후 `stepB`, `stepC` 가 순차 실행되고 stepC 내부에서 `stacktrace` 를 실행하여 다음과 같이 된다

```javascript
stack = [ runScript, stepA, stepB, stepC, stacktrace ]
```

stepC 에서 stackreace, console.log 까지 실행한 뒤에 다시 stepB 로 돌아가는 시점의 stack 은 다음과 같을 것이다.

```javascript
stack = [ runScript, stepA, stepB ]
```

그리고 순차적으로 함수가 종료되며, 스택이 모두 비워지고 더이상 수행할 코드도 없다면 `runScript` 까지 지워지며 프로그램은 끝난다!

javascript 실행기는 코드가 실행되면 `Call Stack` 을 조사한뒤 없어질 때까지 코드를 실행하고 스택이 전부 비워질 경우 실행을 종료하는 것이다.

이 스택은 하나만 존재하며, 단지 스택에 쌓인 일을 처리하는 것 뿐이다. 이 중간에 새로운 함수 호출등으로 스택에 추가되어도 순차적으로 처리될 뿐, 작업 순서의 변동은 없다.

javascript 는 묵묵하게 순차적으로 `Call Stack` 을 비워가며 실행한다.

그렇다면 이벤트 핸들링 함수나 타이머 등의 작업, Ajax 등의 작업은 어떻게 일어날까.

### Event Loop, Job Queue

- DOM 처리 (화면 갱신을 포함한다)
- 애니메이션
- Ajax
- Timer
- Object Observer Callback
- Promise

일련의 비동기 작업들은 `Event Loop` 와 엔진이 실행되는 한 무한정 도는 루프와 `Job Queue` 라는 것으로 처리된다.

코드로 표현하면 다음과 같다.

```javascript
while(queue.waitForMessage()) {
    queue.processNextMessage();
}
```

`Job Queue` 를 감시하다가, 작업이 있으면 꺼내서 javascript 의 `Call Stack` 에 추가한다.

javascript 는 `Call Stack` 에 작업이 추가되었으므로 그것을 실행하여 `Call Stack` 단락에서 본 같은 작업을 진행하게 된다.

```javascript
function stepA() {
    timerA(); // 2
}

function timerA() {
    setTimeout(stepB, 100) // 3
}

function stepB() {} // 7

function stepC() {} // 5

stepA(); // 1
stepC(); // 4

console.log("complete!"); // 6
```

위 코드는 주석에 쓰인 숫자 순서대로 실행된다.

3 부분이 실행되는 시점의 `Call Stack` 은 다음과 같다.

```javascript
stack = [ runScript, stepA, timerA, setTimeout ]
```

이 되고 setTimeout 은 100 밀리세컨드 뒤의 타이머 작업 (`stepB` 함수를 Job Queue 에 넣는 작업) 을 준비한다.

그 뒤 6번째 주석의 코드가 수행 전 시점의 `Call Stack` 은 다음과 같다.

```javascript
stack = [ runScript ]
```

그리고 `console.log` 가 실행되고, 콘솔에 complete 를 출력한 뒤 종료되면 `Call Stack` 은 비워지고 일단 첫 코드 실행은 종료된다.

`Event Loop` 는 `Call Stack` 이 비워졌으므로 `Job Queue` 를 뒤져보지만 비어있는 상태이기에 다음 루프를 진행한다.(대기한다고 표현하는게 더 나을수도)

100 밀리세컨드가 지난 뒤 (`Event Loop`는 그 동안에도 여러번의 루프가 진행되고 있었을 것이다) `Job Queue` 에 `stepB` 함수가 추가된다.

`Call Stack` 도 비어있는 상태이고 `Job Queue` 에도 작업이 있는 상태기에 `Event Loop` 는 `Job Queue` 에서 Job 을 하나 꺼내 실행시킨다. 

실행된 함수는 `Call Stack` 에 추가되고 실행된다.

```javascript
stack = [ runScript, stepB ]
```

최종적으로 stepB 도 종료되고 수행이 끝나면 더이상 수행할 게 없으므로 다시 javascript 실행을 중단하고 `Event Loop` 는 다시 `Job Queue` 에 새로운 Job 이 들어오는지 루프를 돌기 시작할 것이다.

이게 자바스크립트가 비동기를 실행하는 방법이다.

재미있는 것은 이 `Event Loop` 는 ECMAScript 에 포함되는 스펙은 아니며 javascript 엔진을 구동하는 환경에서 제공한다는 점이다.

브라우저라면 브라우저에서 따로 구현된 모듈에서, NodeJS 의 경우에는 [libuv](http://libuv.org/) 라는 라이브러리로 동작한다.

이 이벤트 루프는 [libuv](http://libuv.org/) 의 경우 다중 스레드로 구현되어 있기에, ECMAScript 는 단일 스레드이고 javascript 환경은 멀티 스레드라고 볼 수도 있다.

### Timer

타이머의 동작은 위에서 설명한 대로 지정된 밀리초 이후 작업을 수행하는 것이 아닌 Timer Api 에서 해당 시간만큼 지연된 뒤에 `Job Queue` 에 추가한다.

추가만 한다는게 중요한데, `Job Queue` 에 이미 적재된 Job 이 많거나 javascript 실행에서 상당한 지연이 발생할 경우 그 작업은 예정된 시간보다 늦게 실행될 수 있다.

setTimeout 과 setInterval 의 차이는 스케쥴링을 하느냐 안하느냐의 차이인데, [실제로는 미묘한 차이도 존재](http://www.bsidesoft.com/?p=399#%25ec%258b%25a4%25ed%2596%2589%25ed%2594%2584%25eb%25a0%2588%25ec%259e%2584)하는 듯 하다.

## 그렇다면 비동기 처리는

따로 준비된 비동기 처리구문은 결국 `Job Queue` 에 작업을 추가하고 `Event Loop` 의 한번의 루프에 처리되는 일을 여러 타이밍에 나눠 담는 것이 avascript 의 비동기 처리라고 볼 수 있다.

실제 javascript 의 `Call Stack` 에 추가되는 시점이 `Event Loop` 에 의해 여러 시점이 된다면 비동기 처리가 되는 것이다.

## 장시간 수행 로직에 대한 비동기 처리 예제

가령 서버에서 100만개의 유저리스트를 가져왔고 이 User 리스트에 대해 색인이 필요한 상황이라고 해보자.(물론 클라이언트에서 이걸 처리하고 있는게 이상하긴 하다)

이걸 정직하게 처리하면 분명 사용자는 처리되기 전 까지 버튼을 클릭하거나 페이지를 이동하는 등의 작업을 하지 못하고 정지된 화면을 감상하게 될 것이다.

이럴 경우 비동기 처리를 활용하여 분산처리하는게 좋다.

```javascript
var userList = [ ... 백만개 ... ];
var indexed = {};

// 인덱싱 함수. 구현은 비워두었다.
function indexing(user) {    
    // ... 어떤 인덱스 로직 구현 ...
}

// 실제 작업 진행 함수
// 유저리스트가 비어있다면 false 를 반환하고 있다면 인덱싱을 진행한다
function process() {
    if(!userList.length) return false;
    var user = userList.pop();
    indexing(user);
    return true;
}  

// 작업자를 구동시키는 함수.
// 타이머를 0 밀리세컨드로 허용하는 최소 단위의 스케줄로 매번 주어진 인자를 수행한다.
function work(fn, name) {
    return function go() {
        setTimeout(function() {
            var ret = fn();         
            console.log(ret ? '[' + name + '] processed' : '[' + name + '] stop')
            if(ret) go();
        }, 0);    
    }();
}

// work 함수로 분산 처리한다.
// 몇개를 더 수행해도 상관 없지만 지연 시간이 0초로 주어진 이상 그리 효율은 없을것 같다.
work(process, 'process-1');
// work(process, 'process-2');
```

만일 인덱싱의 종료 조건을 알고 싶다면 `work` 함수의 종료 조건절 `if(ret) go()` 에 완료 콜백으로 처리하는 방법이 있다.

[다음 포스트](https://javarouka.github.io/blog/2016/11/09/javascript-async-promise-2/) 에서 알아볼 Promise.all 과 같이 쓰면 코드가 더욱 간결해질 것이다.

## 참고
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 1](http://www.bsidesoft.com/?p=399)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 2](http://www.bsidesoft.com/?p=414)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 3](http://www.bsidesoft.com/?p=423)
- [NHN Enter # 자바스크립트와 이벤트 루프](https://github.com/nhnent/fe.javascript/wiki/June-13-June-17,-2016)
- [2ality # ECMAScript 6 promises - foundations](http://www.2ality.com/2014/09/es6-promises-foundations.html)
- [jakearchibald's blog # Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules)
