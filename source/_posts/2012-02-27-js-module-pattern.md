---
layout: post
title: "JavaScript Module Pattern"
description: "JavaScript Module Pattern"
date: 2012-02-27
tags: ['javascript', 'design pattern']
comments: true
share: true
image: 'images/brain.png'
thumbnail: 'images/brain.png'
categories: ['Stub-Tech']
---

> 모듈 패턴은 전통적인 소프트웨어 공학에서 클래스 사용에 private 과 public 으로 나뉜 캡슐화를 제공하는 방법이다.<br/><br/>
자바스크립트에서의 모듈 패턴은 전역 영역에서 특정 변수영역을 보호하기 위해 단일 객체 안의 public/private의 변수를 포함할 수 있는 각 클래스 형식의 개념을 구현하는데 사용된다. 이 패턴으로 당신이 페이지에 추가한 추가적인 자바스크립트가 다른 스크립트와 이름이 충돌하는 것을 줄여줄 수 있다.
<br/>- <a href="http://addyosmani.com/resources/essentialjsdesignpatterns/book/#modulepatternjavascript">from Essential Javascript Design Pattern</a>

자바스크립트는 private, public 등의 접근 제한자를 언어차원에서 지원하지 않습니다.

하지만 모듈 패턴을 사용하여 그런 접근 제한을 구현해낼 수 있습니다. 요새 CommonJS, AMD (Asyncronouse Module Definition) 등의 자바스크립트의 표준화의 진행은 자바스크립트의 모듈화에 주안점을 두고 있지요. 그 근간은 이 모듈 패턴입니다.

고급 사용자라면 더욱 미려하고 시적인 모듈 패턴을 구사할 수도 있겠지만 저의 지식이 그에 못미치는 관계로 기초중에 기초만 설명해볼까 합니다.

모듈 패턴을 이해하려면 클로저와 컨텍스트에 대한 지식이 조금은 필요합니다.

그럼 간단한 코드를 예로 들어보죠.
서버에서 데이터를 얻어와 반환하는 코드의 한 예시입니다.
이때 한번 요청한 데이터는 캐싱되어야 합니다. 

```javascript
// 데이터 캐시
var dataCache = {};

// 데이터 캐시 아이디
var id = 0;
    
var url = '/default/data';
// ... 기타 사용 변수

var connectServer = function() { ... }
var sendRequest = function() { ... }
var parseData = function(data) { ... }
var getData = function() {
    connectServer();
    var data = sendRequest();
    dataCache[id++] = data;
    return parseData(data);
} 

```

위와 같은 코드는 잘 동작합니다.

하지만 전역 공간에 변수가 무분별하게 선언되어 있습니다. 이는 위에서 모듈 패턴의 정의에서 말한것과 같이 추가적인 스크립트(외부 라이브러리든 다른 개발자에 의해) 가 있을 경우 이름이 충돌할 수 있습니다. 함수 이름도 getData같은 아주 흔한 이름이기에 출동 가능성은 더욱 높습니다.

그리고 모든 변수들은 public 접근제한 상태입니다.

`connectServer`,  `sendRequest`,  `parseData` 이 세개는 특별한 경우 외엔 다른 곳에서 쓰일 필요가 없습니다.

private 접근제한이 적당할 것 같습니다

전역에 변수를 선언하고 싶지 않으려면 다음과 같이 익명 함수를 통한 선언을 해 볼 수 있습니다. 

```javascript
// 데이터 캐시
var dataCache = {};

// 데이터 캐시 아이디
var id = 0;

// 익명 함수로 감싸 전역 객체를 더럽히지(?)
// 않는다.
// 하지만 여전히 캐시는 전역에...
(function() {
    
    var url = '/default/data';
    // ... 기타 사용 변수
    
    var connectServer = function() { ... }
    var sendRequest = function() { ... }
    var parseData = function(data) { ... }
    
    var getData = function() {
        connectServer();
        var data = sendRequest();
        dataCache[id++] = data;
        return parseData(data);
    }
    
    getData();
    
})(); 
```

자. 어떻습니까. 모든 변수들이 private 스코프가 되었군요. 익명 함수로 인해 전역 스코프 접근도 없게 되었습니다.

그런데 이런 방식으로는 코드의 재사용을 전혀 할 수가 없습니다. 매 데이터 요청 시 저런 긴 코드를 쓸 생각이 아니라면 좀더 생각해 봅시다. 

```javascript
// 데이터 캐시
var dataCache = {};

// 데이터 캐시 아이디
var id = 0;

// 별도의 네임스페이스 적용. 
// 역시 캐시는 밖에 있지만 함수는 재활용이 가능하다.
var getData = function(url) {        
    
    url = url || '/default/data';
    // ... 기타 사용 변수
    
    var connectServer = function() { ... }
    var sendRequest = function() { ... }
    var parseData = function(data) { ... }
    
    connectServer();
    var data = sendRequest();
    dataCache[id++] = data;
    return parseData(data);
} 
```

이건 나름 좋은 방법 같습니다.

필요한 함수들이 private 되어 감춰졌습니다.

최소한으로 전역 영역에 자신을 노출하면서 기능을 재사용할 수도 있습니다. GetData라는 것은 일종의 네임스페이스 역할을 한다고 볼 수 있겠네요.그러나 아직 부족합니다.

저 개념을 좀더 발전시켜 봅시다.

데이터를 일관된 방식으로 요쳥하고 데이터 파서를 지정할 수 있는 객체를 제공하는 모듈을 만듭니다.

그리고 같은 요청시의 캐시 문제도 해결해 봅시다. 

```javascript
var spec = {
    url: '/some/path/data',
    callback: function(data) { ... }, // 콜백 지정
    parser: function jsonParser(data) { ... } // 파서 지정
};
// 모듈화. 생성 인자로 객체를 받는다.
// spec 객체를 바탕으로 객체 생성.
var dataModule = (function(spec) {
    
    // private 영역 시작

    // 데이터 캐시
    var dataCache = {};
    
    // 데이터 캐시 아이디
    var id = 0;
    
    var url = spec.url || '/default/data';
    // ... 기타 사용 변수
    
    var connectServer = function() { ... }
    var sendRequest = function(opt) { ... }
    var parseData = spec.parser || function(data) { ... };
    
    var callback = spec.callback || function() { };    
    var headers = spec.headers || {};

    // private 영역 끝.
    
    
    // 필요한 것만 공개. 접근 제한은 public이 된다
    // 리턴되는 객체의 메서드들은 클로저로서
    // private 영역의 변수에 접근이 가능하다.
    return {
        send: function() {
            connectServer(spec.url, spec.method);
            var data = sendRequest(headers);
            dataCache[id++] = data;
            return parseData(data, callback);
        },
        cache: function(id) { return dataCache[id]; },
        getLastCacheId: function() { return id; }
    } 
    
})(spec); // 익명 함수를 바로 실행

// @Test 코드
// 데이터 요청
var rs = dataModule.send();
console.log(dataModule.getLastCacheId()) // 마지막 요청 아이디
```

무명 함수의 결과를 받는 객체의 이름은 뭘로 지정해도 상관 없습니다. dataModule로 지정해 두었을 뿐 다른 프로그래밍시에는 다른 이름이 될 수도 있겠죠.

모듈은 별도의 정의된 이름 공간에 두면 문제가 없습니다. 한번 사용하고 말 것이라면 내부에 선언하고 바로 처리해도 되겠지요.
모듈 패턴은 사용하기에 따라 굉장한 용도가 있습니다.

어떻게 보면 new 를 사용한 객체의 생성보다 더욱 자바스크립트스러운 객체 생성방법이라고도 생각됩니다.

영어에 자신이 있으신 분은 고수가 쓰신 이 포스팅을 읽어보시길 추천드립니다.