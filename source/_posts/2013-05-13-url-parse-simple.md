---
layout: post
title: "URL 스트링 보다 쉽게 파싱해보기 (with DOM)"
description: "URL 스트링 보다 쉽게 파싱해보기 (with DOM)"
date: 2013-05-13
tags: [ecmascript, javascript]
comments: true
share: true
image: '/asset/images/java-logo.png'
thumbnail: '/asset/images/java-logo.png'
categories: ['Tech-Piece']
---

웹프로그래밍을 하다보면 간간히 특정 문자열로 `window.location` 객체를 생성하고 싶은데 Location은 내부 함수라 사용할 수 없다.

```javascript
new Location("http://www.example.com/?a=b#hash"); // 안됨
```

이럴땐 보통 프로그래머들은 정규표현식으로 문자열을 분해하곤 한다.

하지만 정규표현식이라는 것이 아주 날카로워서 잘못쓰면 손을 베이기 쉽상이다;

역주적 폭주, 예측못한 문자열을 못집어 내는 문제, 느린 문제...

그런데 A 태그를 활용한 URL 분석 방법이 있었다!

```javascript
var parser = document.createElement('a');
parser.href = "http://example.com:3000/pathname/?search=test#hash";

parser.protocol; // => "http:"
parser.hostname; // => "example.com"
parser.port; // => "3000"
parser.pathname; // => "/pathname/"
parser.search; // => "?search=test"
parser.hash; // => "#hash"
parser.host; // => "example.com:3000"
```

심플하고도 강력하다.

관련 링크는 여기

https://gist.github.com/jlong/2428561