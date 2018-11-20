---
layout: post
title: "자바 new String() 시 초보들이 하기 쉬운 실수..."
description: "자바 new String() 시 초보들이 하기 쉬운 실수..."
date: 2011-09-11
tags: [java]
comments: true
share: true
image: '/asset/images/java-logo.png'
thumbnail: '/asset/images/java-logo.png'
categories: ['Tech']
---

캐릭터셋 변환에 대해 인터넷 블로그 등에 잘못 떠돌고 있는 괴담(?) 은아니고 괴코드(?) 가 있다.

```java
// 예상과는 다른 동작을 하는 코드
String convert = new String(message.getBytes("euc-kr"), "utf-8");
```

이건 잘못된 API의 이해가 부른 오동작 코드 이다.

`String::getBytes` 는 자바 내부에 관리되는 유니코드 문자열을 인자로 지정된 캐릭터셋의 바이트 배열로 반환하는 메서드이며, `new String(바이트배열, 캐릭터셋)` 생성자는 해당 바이트 배열을 주어진 캐릭터 셋으로 간주 하여 스트링을 만드는 생성자이다.

다음 예제를 보자

```java
String d = "안녕 親9"; // 자바는 내부 문자열을 모두 유니코드 처리한다
  
// 유니코드 문자열을 UTF-8 캐릭터 바이트배열로 변환하여 반환
byte [] utf8 = d.getBytes("UTF-8");

// 유니코드 문자열을 EUC-KR 캐릭터 바이트배열로 변환하여 반환
byte [] euckr = d.getBytes("EUC-KR");
  
// 당연히 다른 바이트 배열이므로 사이즈가 다르다.
System.out.println("byte length > " + utf8.length); // byte length > 11
System.out.println("byte length > " + euckr.length); // byte length > 8
  
// 실수 코드.
// UTF-8 캐릭터셋으로 배열된 바이트배열을 EUC-KR로 해석할 수 없다.
System.out.println(new String(utf8, "EUC-KR"));
```

절대 캐릭터 변환이라고 `new String(바이트배열, 변환하고싶은 희망사항 캐릭터셋)` 을 쓰는 오류는 범하지 말자.

자바 내부에서 처리하는 문자열은 일괄적으로 같은 유니코드 형식으로 처리되며,

이기종 전송 등 필요한 경우에는 `getBytes()` 로 해당 문자열 바이트 배열로 변환 뒤 전송하면 그만일 것이다.

다만 예전 구형 웹서버등을 사용한 프로젝트의 경우의 문자열을 원래 캐릭터로 복구하는 코드가 위의 new String 을 쓰는 경우가 있는데,
이건 웹 서버에서 캐릭터셋을 잘못 해석하여 주는 것을 바로잡는 코드이거나, 비슷한 캐릭터 코드에서 코드로 해석한 것이며, 캐릭터 셋 변환이 아님을 알아두자.

좋은 참고 글 하나 링크한다.

[Java Character Set](http://kin.naver.com/knowhow/detail.nhn?docId=527939) 의 이해