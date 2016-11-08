---
layout: post
title: "비동기와 Promise #1"
description: "JavaScript 의 비동기와 Promise 에 대해 알아보자"
date: 2016-11-08
tags: [ecmascript, javascript, promise, async]
comments: true
share: true
categories: ['Tech', 'JavaScript', 'Async']
---

## JavaScript 의 미래에 대한 작업 처리

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

JavaScript 의 코드는 항상 `실행-완료 (Run-to-completion)` 을 보장하는데, 이 뜻은 JavaScript 는 코드가 해석되고 수행될 때는 다른 코드의 실행이 되지 않는다는 것이다.

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

하지만 javascript 에서는 여러 타이머나 이벤트 등의 비동기성을 띈 코드가 실행되도 완벽하게 이 모듈의 콜 카운트를 보장할 것이다.

`실행-완료 (Run-to-completion)` 를 보장하기 때문이다. 좀 더 자세히 알아보자.

### JavaScript 는 싱글 스레드다

JavaScript 는 하나의 스레드만 사용한다.

그런데 싱글 스레드라면 자바스크립트가 한번 동작하기 시작하면 다른 작업은 멈춰야 한다. 하지만 실제 구동 환경에서는 그렇지 않다.

우리는 아무렇지도 않게 이벤트를 등록하여 특정 타이밍에 이벤트를 실행시키고, Ajax 로 비동기 처리를 하며, setTimeout이나 setInterval, requestAnimationFrame 등을 사용한다.

애니메이션 처리가 될때 폼에 글자를 입력할수 없는것도 아니고, 스크롤이 정지되지도 않는다.

그럼 어떻게 저런 일이 발생하는 걸까.

이걸 이해하려면 Call Stack 과 Job Queue, 그리고 Event Loop 의 이해가 필요하다.

#### Call Stack

보통 언어에서는 함수가 호출될 경우 함수들은 자신을 호출한 곳으로 되돌아갈 곳을 알아야 한다. 이 정보는 보통 Call Stack 이라는 것으로 관리된다.

> Java 프로그래머라면 이 정보를 보기 위한 Exception::printStacktrace 에 익숙할 것이다 ㅋ

JavaScript 도 타 언어와 비슷한 Call Stack 이라는 게 존재하고, 메서드 수행 시마다 Stack 에 입력한 뒤 순차적으로 스택을 비워가며 실행한다.
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

stepA();
```

콘솔창에서 실행한다고 가정할 때 결과는 대충 아래와 같은 모습이다.

```
at stacktrace (<anonymous>:3:15)
at stepC (<anonymous>:8:5)
at stepB (<anonymous>:5:5)
at stepA (<anonymous>:2:5)
at <anonymous>:1:1
complete!
```

`stepA` 함수가 실행되는 시점에는 스택에 `글로벌` 밖에 없다.

그 후 `stepB` 가 실행되는 시점에 새로이 stepA 가 추가된다. 그 뒤 `stepC` 실행후 `stepB` 가 스택에 추가되어 스택 사이즈는 3이 된다.

그리고 순차적으로 실행이 끝나며 실행한 곳으로 되돌아갈때마다 해당 스택은 지워지고, 마지막 글로벌 영역까지 오게 된다면 스택은 비워진다.

스택이 모두 비워지면 프로그램은 끝난다!

### Job Queue

### Event Loop

## 참고
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 1](http://www.bsidesoft.com/?p=399)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 2](http://www.bsidesoft.com/?p=414)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 3](http://www.bsidesoft.com/?p=423)
- [NHN Enter # 자바스크립트와 이벤트 루프](https://github.com/nhnent/fe.javascript/wiki/June-13-June-17,-2016)

#### ES5 용 구현체들 (중 많이 쓰이는 것들)

- [jQuery Deferred](https://api.jquery.com/category/deferred-object/)
- [bluebird](https://github.com/petkaantonov/bluebird/)
- [q](https://github.com/kriskowal/q)
