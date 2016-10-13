---
layout: post
title: "ECMAScript Decorator 탐구생활"
description: "ES7 의 Decorator 의 이모저모에 대해 알아보자"
date: 2016-09-30
tags: [ecmascript, javascript, decorator, babel]
comments: true
share: true
---

> 이 글은 ES2015+ 문법으로 쓰여졌습니다.

## Decorator?
*함수(function) 표현식(expression)* 에 해당한다.

*@* 와 같이 써서 표현식 뒤에 오는 대상에 더욱 기능적으로 추가하거나(decorating) 하는 일들을 할 수 있다.

함수 표현식이기에 무언가의 실행 결과가 함수가 된다면 그것도 허용된다

가령 이러한 함수가 있다고 한다면

```javascript
function nested(val1) {
    return function (val2) {
        return function (klass) {
            klass.nested = `${val1}/${val2}`;
            return klass;
        }
    }
}
```

아래는 유효한 decorator 가 된다

```javascript
@nested('1')('2')
class Anon { /* ... */ }
```

Arrow Function 도 상관없다

```javascript
const arrow => a => b => c => klass => klass;
@arrow('hello')('world')('decorator')
class WHAT { /* ... */ }
```

대상이 되는 것은
- class
- method (get/set 등의 accessor 를 포함한다)
- property (class, plain object 의 property 를 포함한다)

적용의 이점은 아래와 같은 게 있다.
- 함수에 Interceptor 성의 기능 추가. 로깅 등이나 인자 유효성 검사 등</li>
- 예외 처리나 로깅 등의 공통상황 처리
- Mixin 생성 및 적용 <a href='//medium.com/google-developers/exploring-es7-decorators-76ecb65fb841#22de'>예제 #1</a>
- property descriptor 를 조작하여 get/set 조작 및 열거 등의 조작
- 인자에 따른 Proxy 처리
- ETC... 생각하기에 따라 끝도 없을 듯.

## 일단 타이핑

### 메서드에 실행 권한 추가하기

일단 다음과 같은 class 를 정의해보자

```javascript
class Something {
    firstLove() {
        console.log('첫번째 사랑');
    }
    
    secondLove() {
        console.log('두번째 사랑');
    }
}
```

위의 class 의 첫사랑 (*firstLove*) 메서드에 권한 기능을 추가한다고 해보자. 권한이 있는 사용자만 수행 (...) 을 할 수 있게 하는 거다.

일단 전용 에러 객체와 검증기부터 만들자. 이런 커스텀 오류는 나중에 오류 발생 시 핸들링에 도움을 준다.

```javascript
// 권한 에러 정의
class NotAllowedError extends Error {}

const isAllowed = () => {
    // 구현 로직에 현재 허용 여부를 판단. 반환은 true || false
    // ... 구현은 생략 ...
}
```

이제 발생하는 에러들은 저 에러를 던지도록 한다.

그 다음은 적용 코드 작성.

```javascript
class Something {
    firstLove() {
        if(!isAllowed()) throw new NotAllowedError('권한이 없습니다');
        console.log('첫번째 사랑');
    }
    
    secondLove() {
        console.log('두번째 사랑');
    }
}
```

간단하다. 하지만 두번째 사랑에도 제약이 필요하다면...?

### 점점 코드에 좀비바이러스가 퍼진다

보통 권한 체크같은 공통 관심사 로직에는 여러 작업에 적용되는게 일반적이다.

만일 *firstLove* 메서드 외에도 여러 다른 함수에 적용하려고 하면, *그 수만큼 코드를 추가해야* 할 것이다.

```javascript
class Something {
    firstLove() {
        if(!isAllowed()) throw new NotAllowedError('권한이 없습니다');
        console.log('첫번째 사랑');
    }
    
    secondLove() {
        if(!isAllowed()) throw new NotAllowedError('권한이 없습니다');
        console.log('두번째 사랑');
    }
    
    marry() {
        if(!isAllowed()) throw new NotAllowedError('권한이 없습니다');
        console.log('결혼');
    }
    
    // ... 기타 등등 ...
}
```

...

뭔가 망한 듯 싶다.

아래 코드가 모든 메서드에 추가되어야 하는데, 메서드 추가시마다 작업해주는건 물론이고 검증 로직이 바뀐다면 그동안 적용한 모든 메서드를 전부 수정해야 한다.

```javascript
// 이 코드가 권한을 부여할, 미래에 부여될 모든 메서드 바디안에 중복된다!
              if(!isAllowed()) throw new NotAllowedError('수행 권한이 없습니다');
```

어떻게 해야 할까...

### 좀비화전 예방 백신으로

먼저 다음과 같은 권한 체크 함수를 만든다. 먼저 공통된 작업을 함수로 분리하는 것이다. 보통 이 작업을 <a href='http://m.zdnet.co.kr/news_view.asp?article_id=00000039154322#imadnews' target='_blank'>상황중심 프로그래밍 (Aspect Oriented Programing)</a> 에서는 <em>Advice</em> 라고 부른다.

```javascript
// 미리 예외 객체를 생성해두고 재활용한다
const notAllowedErr = new NotAllowedError('수행 권한이 없습니다');
const checkAllowExecution = () => {
    if(!isAllowed()) throw notAllowedErr;
}
```

이제 래핑이다.

class 의 prototype 을 순회하며 함수일 경우 해당 이름의 메서드에 descriptor 를 조작하는 방법의 구현이다.

```javascript
// 실제 메서드를 조작하는 함수
const wrapBefore = (obj, name, descriptor, advice) => {
    const origMethod = descriptor.value;

    // 속성 재정의
    Object.defineProperty(obj, methodName, {
    value() {
        // 실제 메서드 실행 전 수행한다.
        // 여기서는 권한 체크 checkAllowExecution 함수다.
        advice();
        return origMethod.apply(this, arguments);
        }
    }
};

const allowedExecution = klass => {

    // 사용 될 prototype 을 변수로 선언해둬 변수 탐색을 줄인다
    const proto = klass.prototype;
    
    // 메서드만 전부 뽑는다
    const declaredMethodNames = Object.getOwnPropertyNames(proto)
        .filter(method => (typeof proto[props] === 'function'));
    
    // 이제 루프를 돌며 메서드를 래핑한다.
    declaredMethodNames.forEach(methodName => {
    
        // 속성 디스크립터를 얻는다
        const descriptor = Object.getOwnPropertyDescriptor(proto, methodName);
        
        // 얻은 디스크립터로 해당 메서드를 래핑
        // checkAllowExecution 은 위에서 정의한 권한 체크 함수다.
        wrapBefore(proto, methodName, descriptor, checkAllowExecution);
    });
}
```

이제 적용하자. 클래스를 위의 *allowedExecution* 함수로 감싸면 그만이다.

```javascript
const wrapClass = allowedExecution(Something);
              const myLove = new wrapClass();
              myLove.firstLove(); // throw !! ㅠ.ㅠ 슬프구나
```

자 이제...

### @function expression

이제 Decorator 표현식을 써보자.


Java 등을 해본 분들은 <a href='https://docs.oracle.com/javase/tutorial/java/annotations/declaring.html' target='_blank'>annotation</a> 비스므리한 문법이라 친숙할수도 있다.

사용은 간단하다. 대상 클래스 정의 전에 @캐릭터와 함께 써주는 방식으로 바꾸기만 하면 된다

```javascript
@allowedExecution // here
class Something {
    firstLove() {
        console.log('첫번째 사랑');
    }
    
    secondLove() {
        console.log('두번째 사랑');
    }
    
    marry() {
        console.log('결혼');
    }
}
```

효과는 위의 <a href='#wrapping'>명시적 래핑</a> 과 동일하다.

매우 간단하다!

decorator 라는건 이런 모양이다. 인터프리터 레벨에서 해주는 단축 문법 (보통 Sugaring 이라고 부른다..) 이라고 봐도 무방하다.

## 적용 대상에 따른 시그니처

위에서는 class 의 경우만 해당되었는데, 사실 적용 대상에 따라 decorator 의 시그니처가 달라진다.

### Class 일 경우

```javascript
function decorator(target) { /* ... */ }
```

위에서 우리가 구현했던 내용과 같다.

decorating 할 대상의 의 생성자가 첫번째 인자로 오는 시그니처가 된다.

```javascript
function decorator(target) {
    console.log(target.name); // drive
    console.log(target.prototype); // object
    console.log(Object.getOwnPropertyNames(target.prototype)); // [ drive, stop ]
}

@decorator
class Car {
    drive(){}
    stop(){}
}
```

ES5 문법으로만 작성한다면 다음과 같은 코드가 나올것이다.

```javascript
// decorator support
@Pants({ color: 'red' })
class SuperMan {}

// ES5
var SuperMan = (function() {
    function SuperMan() {}
    
    // 실제 decorate
    return RedPants({ color: 'red' })(SuperMan);
})();
```

### Class Method 일 경우

```javascript
function decorator(target, name, descriptor) { /* ... */ }
```

이 경우에는 인자가 3개이다.

<dl>
    <dt>target</dt>
    <dd>- 메서드의 소유자. Class 라면 해당 Class의 prototype 이 될 것이다.</dd>
    <dt>name</dt>
    <dd>- 메서드의 이름.</dd>
    <dt>descriptor</dt>
    <dd>- 메서드의 프로퍼티 디스크립터. 디스크립터에 대한 내용은 여기서 다루긴 많으므로 <a href='https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#Description' target='_blank'>여기</a>를 참조한다</dd>
</dl>

```javascript
function decorator(target, name, descriptor) {
    // Car
    console.log(target.name);
    
    // drive
    console.log(name);
    
    // { value: function(){}, writable: true, enumerable: false, configurable: true }
    console.log(descriptor);
}

class Car {
@decorator
    drive(){}
    stop(){}
}
```

이 부분도 ES5 문법으로만 작성한다면 다음과 같은 코드가 나올것이다.

```javascript
// decorator support
class SuperMan {
    @speed('1000km')
    fly(){}
}

// ES5
var SuperMan = (function() {

    function SuperMan() {}
        SuperMan.prototype.fly = function(){};
        
        // decorator 를 계산
        var speedDeco = speed('1000km');
        
        // 타겟의 descriptor 를 얻는다
        var descriptor = Object.getOwnPropertyDescriptor(SuperMan.prototype, 'fly');
        
        // decorate
        var decorated = speedDeco(SuperMan.prototype, 'fly', descriptor);
        
        // decorate 결과로 반환된 값이 있다면 descriptor 로 판단하고 타겟 속성을 재정의한다.
        if(decorated) {
        Object.defineProperty(SuperMan.prototype, 'fly', decorated);
    }
    
    return SuperMan;
})();
```

### Plain Object 의 Method 일 경우

Plain Object 의 Method 라는 건 객체 속성에 할당된 함수를 말한다. 이 경우는 위의 <a href='#class-method'>Class Method 의 경우</a> 와 같다

## 몇가지 Examples

### 읽기 전용 속성

함수의 특정 속성을 읽기 전용으로 만들어보자

사용법은 이런 형식으로 될 것이다.

```javascript
class Dog {

    @final
    grr() {
        console.log('그르르')
    }
}

const dog = new Dog();
dog.grr = function wak() {
    console.log('왈왈');
}

// 변하지 않는다.
dog.grr(); // '그르르'
```

실제 코딩은 다음과 같이 나올것이다.

코드의 설명은 주석에 달아두었다. 매우 간단하다.

```javascript
const final = (obj, name, descriptor) => {

    // 디스크립터를 쓰기불가로 설정한 새 디스크립터를 반환한다.
    // 디스크립터를 리턴하면 해당 디스크립터를 적용한다.
    return { ...descriptor, writable: false };
};
```

### 자동 바인딩

함수를 자동으로 소유자에 bind 시키는 decorator 를 만들어보자

사용법은 이런 형식으로 될 것이다.

```javascript
class Programer {
    constructor(name) {
        this.name = name;
    }
    
    @bind
    makeCode() {
        console.log(`${this.name} 은(는) 코드를 만듭니다.`);
    }
    
    makeIncident() {
        console.log(`${this.name} 은(는) 장애를 내버렸습니다.`);
    }
}

const chobo = new Programer('Rouka');

const storedMakeCode = chobo.makeCode;
const storedMakeIncident = chobo.makeIncident;

storedMakeCode();
// makeCode executed
// Rouka 은(는) 코드를 만듭니다

storedMakeIncident();
// undefined 은(는) 장애를 내버렸습니다.
```

실제 코딩은 다음과 같다

코드의 설명은 주석에 달아두었다.

```javascript
// 함수 구별 유틸 함수
const isFunction = v => (typeof v === 'function');

// 인자로 작업 전 수행할 액션을 받는다.
function before(action) {
    
    // 데코레이터는 함수이므로 실행 결과로 함수가 반환되어야 한다.
    return (target, name, descriptor) => {
    
        // descriptor 에서 현재 value 를 꺼낸다
        const value = descriptor.value;
        
        // action 이나 value 가 함수가 아니면 의미가 없다.
        if (!isFunction(action) || !isFunction(value)) return;
        
        let defined = false;
        return {
            ...descriptor,
            get() {
            
                // 다시 바인딩할 필요는 없다.
                if(defined) return value;
                
                const bound = value.bind(this);
                
                Object.defineProperty(this, name, {
                    value: bound
                });
                
                defined = true;
                
                return bound;
            }
        };
    }
}
```

## 결론

코드상으로 상당히 간결해지는 효과가 있으며 여러 상황중심의 코딩이 가능하지만 문제는 ES2015 의 스펙이 아니라서 실제 사용하기까지는 아주 먼 미래의 이야기일 수 있다.

하지만 당장 써보고 싶고 <a href="https://babeljs.io/" target="_blank">Babel</a> 을 사용하고 있다면,

<a href="https://babeljs.io/docs/plugins/transform-decorators/" target="_blank">https://babeljs.io/docs/plugins/transform-decorators/</a> 를 참고해서 자신의 프로젝트에 설정하면 사용해볼 수 있다.