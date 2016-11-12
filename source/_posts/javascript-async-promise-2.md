---
layout: post
title: "비동기와 Promise #2"
description: "JavaScript 의 비동기와 Promise 에 대해 알아보자"
date: 2016-11-09
tags: [ecmascript, javascript, promise, async]
comments: true
share: true
image: 'images/brain.png'
thumbnail: 'images/brain.png'
categories: ['Tech', 'JavaScript', 'Async']
---

<!-- toc -->

[전 포스트](/blog/2016/11/08/javascript-async-promise-1/) 에 이은 글이다.

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

콜백으로 전달된 인자의 유효성 검증은 물론, 예외가 나든 오류가 나든 반드시 콜백을 호출해줘야 한다. 

또, 콜백을 다수 처리해야 할 경우에도 문제가 된다.

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

콜백이라는 것은 결국 내 코드가 다른 로직에서 수행되는 조그만 제어의 역전 (IoC) 이 일어난다고 보면 된다.

- 타겟 함수에 복수의 핸들러 전달이 깔끔하지 못하다.
- 타겟 함수에서 자신과는 관계없는 콜백 함수의 유효성 체크를 담당한다.
- 타겟 함수가 어떤 이유로 콜백을 한번도 호출하지 않을 수 있다.
- 타겟 함수가 어떤 이유로 콜백을 여러번 호출할수도 있다.
- 타겟 함수에서 발생하는 오류 처리 시 콜백을 주게 된다면 서로간 코드가 수정된다.

이런걸 방지하기 위해 실행할 함수는 자신의 로직 외에도, 위의 내용을 전부 방어할 자신의 실제 업무와는 관계없는 코드들로 범벅이 될 것이다.

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
```

이제 사용해보자

```javascript
// 러너로 실행한다!
asyncRunner(goodsOnDeliveryAsync)
    .delivered(enjoyLifeByGoods)
    .delivered(presentGoods)
    .deliverError(crySadLife)
```

`asyncRunner` 함수의 신뢰성만 유지되는 한 타겟 함수와 콜백의 실행 로직은 서로 겹치지 않게 된다.

제어 역전 포인트를 아예 분리해버렸고, 한번 실행된 뒤 다시 콜백을 수행할일도 없이 방어로직을 넣어두었다.

코드가 읽기 간결해지는건 덤이다.

## 그래서 Promise 는 뭔데?

사설이 길었다. 이제부터 제목에 맞는 내용이다.

Promise 는 JavaScript 에서 여러 방법으로 수행하던 비동기 처리에 대한 표준이다. 지금 (now) 은 아니지만 나중 (future) 에 처리될 것으로 생각되는 처리를 표현할 수 있다.

Promise 는 꽤 단순한(해 보이는) [Promise/A Plus](https://promisesaplus.com/) 스펙에 맞춰 구현되어 있으며, ES2015 에서 표준으로 정해지기 전에도 여러 오픈소스 라이브러리 들이 이 표준을 구현하였고 사용되는 것들도 꽤 많다.

ES2015 에서는 언어 자체에 Promise 를 Native 로 지원하게 되어서 위의 라이브러리를 쓰지 않고도 편하게 Promise 를 사용할 수 있고, 추가적으로 위 라이브러리를 써서 유틸성도 얻을 수 있다.

### 기본

기본 사용법은 다음과 같다

```javascript
new Promise([FactoryFunctionExpression])
```

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

의 방식이다.

예제는 이런 식이다

```javascript
var promise = new Promise(function(resolve, reject) {
    resolve('약속해줘~');
});

promise.then(function(val) {
    console.log(val); // 약속해줘~
});

var promise = new Promise(function(resolve, reject) {
    reject('약속은 어기라고 있는 것');
});

promise.catch(function(val) {
    console.log(val); // 약속은 어기라고 있는 것
});
```

`FactoryFunctionExpression` 에는 두가지 인자가 오는데, 첫번째 인자는 Promise 의 상태를 resolved 로 바꾸는 함수, 두번째 인자는 상태를 rejected 로 바꾸는 함수가 온다.

이 두 콜백에는 상태값을 인자로 줄 수 있으며 그 뒤의 then 이나 catch 등의 메서드의 처리 함수들이 그 값을 인자로 받는다.
 
인자는 하나만 허용되며, 두번째 인자는 무시되니, **다수의 인자를 주고 싶다면 Object 타입을 사용** 해야 한다.

#### then, catch

위에서 설명했듯이, Promise 생성자의 첫번째 인자는 함수이고  

Promise 의 프로토타입은 다음과 같다.

![Promise.prototype](/blog/images/promise/promise-internal.png)

`then`은 인자를 두개 받는다.

첫번째 인자는 resolved 상태에 대한 상태값을 받아 처리하는 콜백함수이고 두번째 함수는 rejected 상태에 대한 상태값을 받아 처리하는 콜백 함수이다.

`catch` 는 인자를 하나만 받는데, rejected 상태에 대한 상태값을 받아 처리하는 콜백 함수가 인자가 된다.

```javascript 
somePromise.then(null, function() {})
somePromise.catch(function() {})
```
 
단축 표현이라고 보면 정확하다. 

### 변하지 않아!

Promise 는 한번 상태가 결정되면 절대 변하지 않는다.

resolve 나 reject 함수를 호출하기 전을 `pending` 상태라고 한다. 이후 resolve 혹은 reject 가 수행되면 `resolved` 혹은 `rejected` 상태로 변한다.

한번 상태가 정해지면 다른 상태로는 변하지 않는다. 다시 then 을 호출한다고 해서 전 `pending` 상태의 로직이 다시 실행되거나 하지도 않는다.
 
```javascript
var outer = 1;

var promise = new Promise(function(resolve) {
    resolve(++outer);
});

promise.then(console.log); // 2
promise.then(console.log); // 2
```

몇번을 호출해도 결과는 같다. 

한번 정해진 상태는 그대로 유지된다. 이건 기존의 콜백 로직과는 확실히 구분되는 강력함이라고 볼 수 있다.

또한, 한번 `resolved`, `rejected` 상태로 변경된 뒤에는 다른 상태 변환 시도는 무시된다.

```javascript
// 일부러 두 콜백을 모두 호출해본다.
var promise = new Promise(function(resolve, reject) {

    // resolved 로 상태가 변경됨. 
    resolve('완료되었어!');
    
    // resolved 된 상태에서 reject 를 호출한다.
    reject('이런! 벌써 완료되었나!');
});

promise.then(console.log); // 수행된다
promise.catch(console.log); // 수행되지 않는다
```

이 reject 를 먼저 호출하고 resolve 를 호출해도 마찬가지다. 아주 중요한 개념이니 잘 알아두자.

### 여유로운 비동기 실행

Promise 의 then 과 catch 등의 콜백은 기본적으로 **비동기로 실행** 된다.

다음 예제를 보자

```javascript
console.log('시작합니다');

new Promise(function(resolve) { 
    console.log('Promise 시작합니다');
    resolve('Promise 수행되었습니다') 
}).then(console.log);

console.log('종료되었습니다');
```

실행 순서는 어떻게 될까?

답을 보기 전 5초만 생각해보는걸 추천한다.

...

...

...

...


답은 아래와 같다.
 
```
시작합니다
Promise 시작합니다
종료되었습니다
Promise 수행되었습니다
```

그럼 Timer 함수들과는 어떨까?

```javascript
console.log('시작합니다');

console.log('Timer 설정합니다');
setTimeout(function() {
    console.log('Timer 수행되었습니다');
}, 0);

new Promise(function(resolve) { 
    console.log('Promise 시작합니다');
    resolve('Promise 수행되었습니다') 
}).then(console.log);

console.log('종료되었습니다');
```

이 문제는 배경 지식이 없으면 예측이 어렵다.

답은 다음과 같다.
 
```
시작합니다
Timer 설정합니다
Promise 시작합니다
종료되었습니다
Promise 수행되었습니다
Timer 수행되었습니다
```

같은 한번의 수행 프레임내에서 예약되는 Timer 와 Promise 는 언제나 Promise 의 실행이 우선되고, Timer 는 나중이 된다.
  
Timer 에 아주 짧은 시간을 설정해도 소용없다.

이 건에 대해서는 [다음 포스트](/blog/2016/11/12/javascript-async-promise-3/) 에서 다룬다. 지금은 Timer 보다 Promise 의 콜백이 내부적으로 실행 우선권을 가지고 있다고만 생각하자.

### 체이닝!

Promise 의 then 과 reject 메서드는 [체이닝 메서드](https://en.wikipedia.org/wiki/Method_chaining) 로서 다음과 같이 코딩할 수도 있다

```javascript
somePromiseInstance
    .then(function(data) {
        // ... fulfilled callback ...
    })
    .catch(function() {
        // ... reject callback ...
    });
```

중요한 건 then 을 연결할 경우 앞선 promise 의 반환값이 다음 then 의 인자로 전달되며 순차적으로 실행된다.

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
    .then(console.log); // 20
```

then 을 호출한 순서 차례대로 실행되며 이전 then 의 결과를 다음 then 이 받는다.

만일 then 에서 아무것도 반환하지 않을 경우 undefined 가 전달된다. (이걸 자주 잊어 실수하는 프로그래머들이 종종 있다. 잘 기억하자)

#### chaining VS forking

메서드 체이닝 시 주의할 점이 있다. 

체이닝으로 사용할 때가 있고 사용하지 않아야 할 때가 있다. 아래 예제에서 위 코드와 아래의 코드는 전혀 다른 동작을 유발한다.

```javascript
var promise = new Promise(function(resolve, reject) {
    resolve(100);
});

function pow(val) { return val * val }

// CASE 1
promise.then(pow);
promise.then(pow).then(console.log);

// CASE 2
promise.then(pow).then(pow).then(console.log);
```

**CASE 1** 의 코드는 resolved 상태의 값이 한번만 곱해지지만, **CASE 2** 는  resolved 상태의 값이 두번 곱해지며 전혀 다른 결과를 내놓는다.

단순하지만 종종 헷갈릴 수 있으니 조심하자.

#### 약속에서 다른 약속을 잡을 때

재미있는건 반환값이 일반적인 표현식이 아닌 Promise 를 반환할 경우 그 Promise 로 다음 then 값이 대체된다는 점이다. 이걸 활용하면 여러가지 재미있는 일들을 할 수 있다.

앞으로의 글의 이해를 더 돕기 위해 포스트 내에서 계속 사용될 유틸성 함수 두개를 작성하자.

```javascript
/**
 * 지연 함수
 *
 * @param action 실행 작업 함수
 * @param ms 작업 지연 밀리초
 * @return promise 객체
 */
function delay(ms, action) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve(action && action());
        }, ms);
    });
}
/**
 * 로깅 Thunk 함수.
 * Thunk 는 일단 [아직 평가되지 않은 값(value that is yet to be evaluated)] 을 말한다.
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

- `delay` 함수는 특정 시간이 지난 뒤에 resolve 되는 Promise 를 반환한다. 인자는 두개로 첫번째 인자는 대기시간, 두번째 인자는 선택적으로, 지연 뒤 수행할 함수를 받는다. 이 함수의 실행 결과는 resolve 에 전달된다.
- `logThunk` 는 logging [thunk](http://stackoverflow.com/questions/2641489/what-is-a-thunk) 를 반환하는 함수다.

이제 이 두 함수로 Promise resolve 에서 Promise 를 반환하게 해보자.

```javascript
delay(1000, logThunk('첫번째'))
    .then(function() {
        return delay(1000, logThunk('두번째'));
    })
    .then(function() {
        return delay(1000, logThunk('세번째'));
    });
```

대략 1초 간격으로 `첫번째 두번째 세번째` 가 콘솔에 출력될 것이다.

Promise 를 반환하여 그 뒤의 then 메서드의 컨텍스트가 반환된 Promise 로 교체된 것이다. 

비동기 로직인데도, 순차 실행되는 것을 확인할 수 있다.

### 에러 처리도 간단

Promise 의 예외 처리를 하고 싶어서 다음과 같은 코드를 작성했다.

```javascript
try {
    delay(1000, function() {
        throw new Error('Oops');
    });
}
catch(ex) {
    console.log(ex.stack); // Oops?
}
```

이 코드의 catch 블럭안의 stack 은 찍히지 않는다. [다음 포스트](/blog/2016/11/12/javascript-async-promise-3/) 의 Task 와 MicroTask 에서 다루겠지만, Promise 는 이런식의 예외 처리는 불가능하다.

Promise 는 Timer 와 비슷하면서도 다른 비동기 처리를 하며 Promise 의 콜백들은 그룹화된 **Task Queue** 로 관리된다. (MicroTask 라고 한다)

실제 Promise 콜백이 실행되는 시점은 try/catch 구문이 끝난 뒤다.

그럼 예외가 날 경우 어떻게 하지?! 

걱정하지 않아도 괜찮다. 간단하게 처리할 수 있게 Promise 가 만들어져 있다.

Promise 는 흐름 중에 예외가 발생할 시 내부적으로 상태가 **rejected** 상태로 변경되고 reject 콜백으로 전달된다.
 
```
delay(1000, function() {
    throw new Error('Oops');
})
.catch(function(err) {
    console.log(err.message); // Oops
})
.then(function() {
  console.log('에러 처리 완료');
});
```

catch 를 사용하여 일관되게 에러를 핸들링이 가능하다.

catch 콜백도 체이닝되므로 catch 뒤에 then 을 붙이면 안전하게 Promise 체이닝을 이어가는것도 가능하다.

## 기타 정적 메서드들

### Promise.resolve([statusValue]);

즉발로 상태값이 **resolved** 으로 설정된 Promise 인스턴스를 생성한다.

```javascript
Promise.resolve(100).then(console.log) // 100;
```

이 함수는 아주 강력한 기능이 있다.

Promise.resolve 는 상태값으로 넘기는 인자가 Promise 인 경우 Promise 그대로 반환한다.

```javascript
var promise1 = new Promise(function(resolve) {
    resolve();
});

var promise2 = Promise.resolve(promise1);

console.log(promise1 === promise2); // true. 같다!
```

아래 코드의 Promise 들은 전부 같다.

```javascript
var promise1 = Promise.resolve(1);
var promise2 = Promise.resolve(promise1);
var promise3 = Promise.resolve(promise1);
var promise4 = Promise.resolve(promise2);

console.log(promise1 === promise2);
console.log(promise2 === promise3);
console.log(promise1 === promise3);
console.log(promise1 === promise4);
```

이것만으로는 별 특별한게 없다.

하지만 resolve 에는 **Promise 정규화** 라는 아주 강력한 기능이 있다.

Promise 가 아닌 then 함수를 가진 객체 (보통 ***thenable*** 이라고 부른다) 를 인자로 넘길 경우 Promise 로 정규화한 뒤 반환한다! 

```javascript
var thenable = {
    then(resolve, reject) {
        resolve('안녕? 난 thenable 이야.');
    }
}

Promise.resolve(thenable).then(function(value) {
    console.log(value); // 안녕? 난 thenable 이야.
});

// 심지어 이런 중첩된 thenable 도 정규화해버린다!
var nestedThenable = {
    then(resolve, reject) {
        return resolve(thenable);
    }
}

Promise.resolve(nestedThenable).then(function(value) {
    console.log(value); // 대단하다!
});
```

Promise.resolve 내부적으로 주어진 인자에 then 이라는 이름의 메서드가 있는지 판단하여, 있다면 그것을 Promise 로 정규화해버린다. 강력하다.

앞서 Promise 상태는 불변이라고 한거 기억나는가?

Promise.resolve 는 그것까지 정규화한다.

```javascript
// 일반적인 thenable 이다.
var thenable = {
    then(resolve, reject) {
        
        // 두 콜백을 전부 호출해버린다.
        resolve('안녕? 난 thenable 이야.');
        reject('핫핫핫! 거부한다');
    }
}

// 하지만 정규화.
Promise.resolve(thenable)
    .then(function(value) {
        console.log(value); // 안녕? 난 thenable 이야.
    })
    .catch(function(value) {
        console.log(value); // 실행되지 않는다.
    });
```

만일 어떤 값이 Promise 인지 아닌지 판단할 수 없을 경우, Promise.resolve 로 감싸면 안전하게 그 값을 Promise 취급할 수 있게 해주는 아주 고마운 함수이다.

이 방법은 특히 Promise API 가 나오기 전의 비슷한 Promise 구현들 ([jQuery Deferred Object](https://api.jquery.com/category/deferred-object/), [q](https://github.com/kriskowal/q)) 을 Promise 표준에 맞춰 일관되게 사용할때 매우 유용하다.

전달받은 인자가 의심쩍을 경우 Promise 로 래핑해버리자. 그게 Promise 라면 그냥 반환하니까 좋고, 아닐 경우에도 Promise 로 바꿔준다. 

정말 사랑스러운 메서드다.

### Promise.reject([statusValue]);

Promise.resolve 에서 상태값만 rejected 로 바뀐 대칭적인 메서드다. Promise.resolve 가 인자를 내부적으로 정규화해봐야 resolved 인지 rejected 인지 알 수 있다면, 이 메서드는 값이 무엇이든 그냥 rejcted 상태로 바꿔버린다는것만 다르다.  

### Promise.all([ ...promise ]);

Promise 의 배열을 인자로 받고 Promise 가 전부 resolve 되면 `resolved`, 혹은 promise 배열중 하나라도 rejected 되면 `rejected` 가 되는 Promise 를 반환한다.

then 의 콜백에 전달되는 인자는 Promise.all 에 전달된 promise 의 순서대로 상태값의 배열로 전달된다.
 
```
var normalPm = new Promise(function(resolve) {
    resolve('ok-1')
});

var asyncPm = delay(2000, function() { return 'ok-2' });

var immidiatePm = Promise.resolve('ok-3');

Promise.all([ normalPm, asyncPm, immidiatePm ]).then(function(resolvedArr) {
    console.log(resolvedArr); // [ 'ok-1', 'ok-2', 'ok-3' ]
});
```

### Promise.race([ ...promise ]);

Promise.all 이 전부 resolved 혹은 하나라도 rejected 를 처리한다면 이 메서드는 인자로 전달된 promise 중 하나의 상태변화만을 처리한다.

Promise 중 하나라도 상태가 변할 경우 즉시 그 Promise 의 상태값을 처리한다. 이름 그대로 경합이라고 볼 수 있다.

```
var rabbit = delay(1000, function() { return '토끼' });
var turtle = delay(2000, function() { return '거북이' });

Promise.race([ rabbit, turtle ]).then(function(resolved) {
    console.log(resolved); // '토끼'
});
```

위 예제의 실행 결과는 언제나 **토끼** 가 된다.

이 메서드가 일반적으로 유용하게 쓰이는 부분은 타임아웃 처리가 필요한 부분이다

```javascript
var userRequest = ajaxRequest('/api/user/list');
var timeout = delay(3000, function() { 
    return Promise.reject('서버 응답이 늦습니다'); 
});

Promise.race([ userRequest, timeout ])
    .then(handleUserList)
    .catch(handleServerTimeout)
```

서버 통신, WebSql 등의 작업, WebWorker 연계 등 사용처는 많다.

## 결론

Promise 에 대해 글을 쓰려고 마음먹은건 몇달 전이다.

지지부진했던 이유가 부분이 가볍게 설명하자니 너무 간단하고 성의없어지고, 조금만 살을 붙여도 너무 많아지는 거였다.
 
결국 써놓고 보니 장문의 포스트가 되어버렸다. 읽는데 굉장한 불편함이 있을거라 생각된다. 읽을 사람이 있을지도 모르겠지만...

## 참고
- [비동기와 Promise 1](/blog/2016/11/08/javascript-async-promise-1/) 
- [비동기와 Promise 2](/blog/2016/11/09/javascript-async-promise-2/) 
- [비동기와 Promise 3](/blog/2016/11/12/javascript-async-promise-3/) 
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 1](http://www.bsidesoft.com/?p=399)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 2](http://www.bsidesoft.com/?p=414)
- [BsideSoft 공식 블로그 # 동기화 vs 비동기화 3](http://www.bsidesoft.com/?p=423)
- [NHN Enter # 자바스크립트와 이벤트 루프](https://github.com/nhnent/fe.javascript/wiki/June-13-June-17,-2016)
- [2ality # ECMAScript 6 promises - foundations](http://www.2ality.com/2014/09/es6-promises-foundations.html)
- [jakearchibald's blog # Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules)

<!--#### ES5 용 구현체들 (중 많이 쓰이는 것들)-->

<!--- [jQuery Deferred](https://api.jquery.com/category/deferred-object/)-->
<!--- [bluebird](https://github.com/petkaantonov/bluebird/)-->
<!--- [q](https://github.com/kriskowal/q)-->
