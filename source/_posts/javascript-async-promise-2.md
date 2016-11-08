---
layout: post
title: "비동기와 Promise"
description: "JavaScript 의 비동기와 Promise 에 대해 알아보자"
date: 2016-11-09
tags: [ecmascript, javascript, promise, async]
comments: true
share: true
categories: ['Tech', 'JavaScript', 'Async']
---

## 그동안 우리가 해오던 미래일의 처리

온라인 쇼핑을 하다보면 주문서에 택배기사에게 전할 말을 기록하는 공간이 있다. 보통 그곳에는 이렇게 적는 사람이 많을것이다 (나는 대부분 아래와 같이 적어둔다.)

> 택배 완료전에 전화주세요.

지금은 택배가 오지 않았지만 `택배가 올 미래` 에 `전화해달라` 는 처리를 부탁하고 있는 것이다.

물건을 주문한 사람은 택배가 올 때까지 마냥 기다릴 필요가 없고 다른일을 하다가 택배 도착 전 오는 전화를 받을 수 있다. 택배를 받으려고 택배직원을 아무것도 안하고 마냥 기다리려는 사람은 없을것이다

```javascript
var goods = goodsOnDelivery(); // 배달될 때까지 기다려야한다!
enjoyLife(goods); // 만일 배달되지 않는다면 인생을 못즐길 것이다.
```

### 콜백함수

보통 이런 경우에는 비동기 함수와 콜백을 같이 쓴다. 아래와 같은 방식이다

```javascript
// 배달될 경우에 수행할 작업을 콜백으로 전달해둔다.
goodsOnDeliveryAsync(function(goods) { // 콜백!
    enjoyLifeByGoods(goods);
});
enjoyLifeByExistsGoods();
```

배송을 시키고, 다른걸로 놀다 (enjoyLifeByExistsGoods) 가 배송되면 배송된 걸로 노는 것 (enjoyLifeByGoods) 이다.

물론 실행 순서는 `goodsOnDeliveryAsync -> enjoyLifeByExistsGoods -> enjoyLifeByGoods`.

### 콜백의 문제점

여기서 조금 더 생각해보자.

`goodsOnDeliveryAsync` 는 자신이 맡은 배송 외에도, 추가적으로 자신과는 전혀 관계가 없는 콜백 함수를 처리할 임무를 맡고 있다.
콜백으로 전달된 인자의 유효성 검증은 물론, 예외가 나든 오류가 나든 반드시 콜백을 호출해줘야 한다. 그리고 작업을 여러개 처리해야 할 경우에도 문제가 된다.

이렇게 콜백을 지정할수도 있다. 하지만 별로 좋아보이진 않는다.

```javascript
asyncFunc(function(goods) {
    callback1(goods);
    callback2(goods);
    callback3(goods);
});
enjoyLifeByExistsGoods();
```

물론 콜백안에 함수 셋을 전달할 수도 있지만 가독성 면에서 그리 좋은 방법은 아니다. 게다가, callback1 에서 예외가 던져질 경우 나머지 콜백들은 수행조차 하지 못한다.

더 심각한건, 만일 콜백을 받는 함수에서 어떤 문제가 발생하여 콜백을 실행하지 않을수도 있다.
위에서 본 `goodsOnDeliveryAsync` 함수는 내가 만든 함수이기에 문제가 발생해도 수정이 가능하지만, 만일 타 팀이나 외부 라이브러리의 콜백을 사용한다면 그 함수를 신뢰할 수 있는지는 고민해볼 문제다.

콜백이라는 것은 결국 내 코드가 다른 로직에서 수행되는 조그만 제어의 역전이 일어난다고 보면 된다.

콜백이라는 것은 결국 내 코드가 다른 로직에서 수행되는 조그만 제어의 역전 (IoC) 이 일어난다고 보면 된다.

- 타겟 함수에 복수의 핸들러 전달이 깔끔하지 못하다.
- 타겟 함수에서 자신과는 관계없는 콜백 함수의 유효성 체크를 담당한다.
- 타겟 함수가 어떤 이유로 콜백을 한번도 호출하지 않을 수 있다.
- 타겟 함수가 어떤 이유로 콜백을 여러번 호출할수도 있다.
- 타겟 함수에서 발생하는 오류 처리 시 콜백을 주게 된다면 서로간 코드가 수정된다.

이런걸 방지하기 위해 실제 로직으 실행할 함수는 위의 내용을 전부 방어할 자신의 실제 업무와는 관계없는 코드들로 범벅이 될 것이다.

이럴땐 앞서간 선배들은 관심사의 분리 ([참고](https://medium.com/@smartbosslee/%EA%B4%80%EC%8B%AC%EC%82%AC%EC%9D%98-%EB%B6%84%EB%A6%AC-separation-of-concerns-soc-8a8d09df066d#.5ky43hl7n)) 를 이야기한다.

서로의 두 흐름 사이에 메신저 역할의 인터페이스나 매니저를 두는 방향으로 한번 구현해보자

수도 코드로는 대충 이런 식으로

```
실행기(실제로직).인터페이스(콜백).에러인터페이스(에러핸들러)
```

아래는 구현 코드.

뭔가 장황해 보이고 장점이 없어 보이지만, 이 코드는 한번 잘 구현해둘 경우 다시는 볼일이 없으니 괜찮다(?).

```javascript
/**
 * @param job 비동기 함수
 * @return callback 등록 인터페이스
 */
function asyncRunner(job) {
    var future = [];
    var errorHandler = function(err) {}
    var executed = false;
    // 비동기 함수에서 콜백을 실행한다.
    // 유효성 검사를 할 필요가 없이 확실한 함수를 전달한다.
    job(function(data) {
        // 이미 수행되었거나 실행할 작업이 없어도 중단한다.
        if(executed || !future.length) return;
        try {
            // Go.
            future.forEach(function(job) {
                job(data);
            });
        }
        catch(error) {
            // 에러가 나면 지정된 에러 핸들러를 실행하고 중단한다.
            return errorHandler(new Error(error));
        }
        finally {
            executed = true;
        }  
    });
    return function(goods) {
      return {
          // 미래에 처리할 작업을 등록하는 메서드를 반환한다
          delivered: function(job) {
              if(job) future.push(job);
              return this;
          },
          // 에러 핸들러를 등록한다.
          deliverError: function(_errorHandler) {
              errorHandler = errorHandler || _errorHandler;
              return this;
          }
      }
    }
}
// 러너로 실행한다!
asyncRunner(goodsOnDeliveryAsync)
    .delivered(enjoyLifeByGoods)
    .delivered(presentGoods)
    .deliverError(crySadLife)
```

이제 asyncRunner 함수의 신뢰성만 유지되는 한 타겟 함수와 콜백의 실행 로직은 서로 겹치지 않게 된다.

제어 역전 포인트를 아예 분리해버렸고, 한번 실행된 뒤 다시 콜백을 수행할일도 없이 방어로직을 넣어두었다.

코드가 읽기 간결해지는건 덤이다.

## 그래서 Promise 는 뭔데?

사설이 길었다. 이제부터 제목에 맞는 내용이다.

Promise는 JavaScript 에서 여러 방법으로 수행하던 비동기 처리에 대한 표준이다. 지금 (now) 은 아니지만 나중 (future) 에 처리될 것으로 생각되는 처리를 표현할 수 있다.

Promise 는 꽤 단순한(해 보이는) [Promise/A Plus](https://promisesaplus.com/) 스펙에 맞춰 구현되어 있으며, ES2015 에서 표준으로 정해지기 전에도 여러 오픈소스 라이브러리 들이 이 표준을 구현하였고 사용되는 것들도 꽤 많다.

ES2015 에서는 언어 자체에 Promise 를 Native 로 지원하게 되어서 위의 라이브러리를 쓰지 않고도 편하게 Promise 를 사용할 수 있고, 추가적으로 위 라이브러리를 써서 유틸성도 얻을 수 있다.

기본 사용법은 다음과 같다

```javascript
var promise = new Promise(function(resolve, reject) {
    // implementation ...
});
promise.then(function(data) {
        // ... fulfilled callback ...
})
promise.catch(function() {
    // ... reject callback ...
});
```

Promise 의 then 과 reject 메서드는 [체이닝 메서드](https://en.wikipedia.org/wiki/Method_chaining) 로서 다음과 같이 코딩할 수도 있다

```javascript
promise
    .then(function(data) {
        // ... fulfilled callback ...
    })
    .catch(function() {
        // ... reject callback ...
    });
```

### 체이닝

앞서 말했지만 then 을 연결할 경우 앞선 promise 의 결과가 다음 then 의 인자로 연결된다는 점이다.

다음 코드를 보자

```javascript
new Promise(function(resolve, reject) {
        resolve(100); // resolved!
    })
    .then(function(value) { // 앞선 결과를 연결한다.
        return value * 2
    })
    .then(function(value) {
        return value - 10
    })
    .then(function(value) {
        return value + 60
    })
    .then(function(value) {
        console.log(value); // 결과는 250.
    });
```

만일 then 에서 아무것도 반환하지 않을 경우 undefined 가 전달된다

더 재미있는건 Promise 를 반환할 경우 그 Promise 로 다음 then 값이 대체된다는 점이다.

예제와 함께 알아볼텐데, 그 전 일단 두고두고 사용할 유틸성 함수 두개를 작성하자.

```javascript
/**
 * 지연 함수
 *
 * @param action 실행 작업 함수
 * @param ms 작업 지연 밀리초
 * @return promise 객체
 */
function delay(action, ms) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            var ret = action();
            resolve(ret);
        }, ms);
    });
}
/**
 * 로깅 Thunk 함수.
 * Thunk 는 일단 [아직 평가되지 않은 값(value that is yet to be evaluated)] 을 말한다
 * js 에서는 보통 함수로 호출될 코드 조각을 말한다.
 *
 * logThunk 함수는 메시지를 받으면 그 메시지를 호출하는 함수를 반환하는 Thunk.
 *
 * @param message 로깅할 함수
 */
function logThunk(message) {
    return function() {
        console.log(message);
    }
}
```

이제 이 두 함수로 Promise resolve 에 Promise 를 반환하게 해보자.

```javascript
delay(logThunk('첫번째'), 1000)
    .then(function() {
        return delay(logThunk('두번째'), 1000);
    })
    .then(function() {
        return delay(logThunk('세번째'), 1000);
    });
```

## 상태

Promise 는 반드시 3개의 상태를 가지며 각 상태들에 진입하면 전의 상태로는 돌이킬 수 없다.

3개의 상태는

- pending
- fulfilled
- rejected

가 있다.

## setTimeout, setInterval VS Promise

## jQuery Deferred 와의 비교

## 응용

## 결론

## 참고
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 1](http://www.bsidesoft.com/?p=399)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 2](http://www.bsidesoft.com/?p=414)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 3](http://www.bsidesoft.com/?p=423)
- [NHN Enter # 자바스크립트와 이벤트 루프](https://github.com/nhnent/fe.javascript/wiki/June-13-June-17,-2016)

#### ES5 용 구현체들 (중 많이 쓰이는 것들)

- [jQuery Deferred](https://api.jquery.com/category/deferred-object/)
- [bluebird](https://github.com/petkaantonov/bluebird/)
- [q](https://github.com/kriskowal/q)
