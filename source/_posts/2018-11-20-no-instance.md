---
layout: post
title: "LazyHolder 기법 (Effective java 3th - Item4)"
description: "인스턴스화를 막으려거든 private 생성자를 사용하라"
date: 2018-11-20
tags: [java, singleton, lazyholder, effective]
comments: true
share: true
toc: true
image: '/asset/images/java-logo.png'
thumbnail: '/asset/images/java-logo.png'
categories: ['Effective Java']
---

## 개요

Java 에서의 생성자는 접근제어로 통제할 수 있기에 객체 생성에 생성자를 쓰고 싶지 않다면, private 접근제어를 줘서 막자.

<p align="center">
    <img src="/asset/images/effective/item4-cannot-extends-because-private.png">
</p>

위 그림의 예제처럼, 상속을 방어하는 효과도 있다.

클래스 A 는 B의 생성자를 체이닝하려 하지만 접근이 막혀 컴파일 오류를 발생시킨다.

## LazyHolder 기법

책에는 소개되지 않지만 싱글턴 기법으로 `LazyHolder` 라는 방법이 있다.

책에서는 Enum 방식을 안전하다고 제안하고 있지만 Android 같이 [Context](https://www.google.co.kr/search?q=androlid+Context) 의존성이 있는 환경일 경우, Singleton의 초기화 과정에 Context라는 의존성이 끼어들 가능성이 있다.

`LazyHolder` 는 그에 대한 대안으로 나온 방법이다. JVM에게 객체의 초기화를 떠님기는 방식으로, 멀티스레드 환경에서도 객체의 단일성을 보장할 수 있다.

```java
public class OnlyOne {
    
    private OnlyOne() {}

    public static OnlyOne getInstance() {
        return LazyHolder.IT;
    }

    private static class LazyHolder {
        private static final OnlyOne IT = new OnlyOne();  
    }
}
```
객체 생성을 담당할 내부클래스를 하나 정의하는데, 이것이 `LazyHolder` 다.
OnlyOne 클래스는 초기에는 아무런 상태가 없기에 LazyHolder 클래스를 초기화하지 않지만, `getInstance` 메서드가 호출될 때 LazyHolder 가 로딩되며 초기화가 진행된다.

클래스의 내부의 클래스는 외부의 클래스가 초기화될때 초기화되지 않고, 클래스의 static 변수는 클래스를 로딩할 때 초기화되는 것을 이용한 기법이다.

Class 를 로딩하고 초기화하는건 JVM 의 영역이고 `Thread Safe` 를 보장한다.