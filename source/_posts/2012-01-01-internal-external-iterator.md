---
layout: post
title: "이터레이터 패턴의 내부 반복자와 외부 반복자"
description: "이터레이터 패턴의 내부 반복자와 외부 반복자"
date: 2012-01-01
tags: [java]
comments: true
share: true
toc: true
image: 'images/brain.png'
thumbnail: 'images/brain.png'
categories: ['Tech-Piece']
---

## 스터디중의 의문. Internal and External Iterator

금일 자바카페 스터디 디자인패턴 이터레이터 패턴 (Iterator Pattern) 중에 내부반복자와 외부 반복자 이야기가 나왔습니다. 

반복자는 알겠는데, 외부 반복자와 내부 반복자로 구분된다고???
바로 검색에 들어갔습니다.

역시 구글의 힘... 언어별로 다양한 예가 나와 있더군요. 

##  외부 반복자

외부 반복자는 흔히 배열애서 요소를 for나 while 등의 루프로 요소를 하나씩 꺼내서 직접 조작하는 방식입니다. 

```java
List<String> list = new ArrayList<String>();
list.add("h");
list.add("e"); 
list.add("l"); 
list.add("l"); 
list.add("o"); 
Iterator<String> iter =  list.iterator();
while(iter.hasNext()) {
    String value = iter.next();
    /* 뭔가 하기... */
}
```

클라이언트 코드에서 직접 반복 객체를 가져오고 직접 처리하고 있죠. 

##  내부 반복자

그럼 내부 반복자는 뭘 말하는 것일까요.
컬렉션의 반복을 사용자가 하는게 아니라, 사용자는 반복당 수행할 액션만을 제공하고, 그 액션을 컬렉션이 받아 내부적으로 처리하는 방식입니다.
이때 수행 액션은 보통 콜백 함수로 전달됩니다.
내부 반복자는 기본 자바 API 의 기본 콜렉션에서는 지원하지 않는 것 같습니다. 다른 언어에서는 지원하고 있는데, 자바에서 사용하려면 직접 구현해야 합니다. 
보통 타 언어에서는 
$.each(ary, function(index, element) {
    // 요소마다 한번씩 호출
    console.log(element);  
});
같은 방식의 메서드를 지원하고 있습니다.
위는 javascript의 jQuery 형식입니다.

자바에서는 앞서 말했듯이 없기에 직접 구현해야 할 것 같습니다.
제가 구현한 코드를 써볼게요...

```java
package me.javarouka.dp.iterator;

import java.util.ArrayList;

// 제네릭스 사용.
// 편의상 ArrayList를 상속했습니다.
public class InternalIterationList<E> extends ArrayList<E> {
    
    private static final long serialVersionUID = 1L;

    // 반복 작업을 처리하게 할 콜백 인터페이스.
    // 편의상 스테틱 내부 인터페이스로 구현
    public static interface Callback<E> {
        public E map(E e);
    }
    
    // 실제 반복자. 자신의 요소에 콜백을 한번씩 호출
    public void each(Callback<E> callback) {
        int len = this.size();
        for (int i = 0; i < len; i++) {
            callback.map(this.get(i));
        }
    }
    
    @Test
    public void testClass() {
        InternalIterationList<String> internalIterator 
            = new InternalIterationList<String>();
        
        internalIterator.add("Hello");
        internalIterator.add(", ");
        internalIterator.add("World");
        
        // 내부 반복
        internalIterator.each(new Callback<String>() {
            
            @Override
            public String map(String e) {
                System.out.print(e);
                return e;
            }
        });
    }
}
```

## 결론

- 외부반복자는 일반적으로 사용하는 루프처럼 요소를 사용하는 측(클라이언트)가 직접 컬렉션 요소를 하나씩 꺼내와서 반복 처리
- 내부반복자는 처리할 행동(보통 콜백 함수)을 컬렉션 요소에 넘겨주어 반복 처리