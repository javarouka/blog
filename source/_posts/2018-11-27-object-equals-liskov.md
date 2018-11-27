---
layout: post
title: "Equals 구현과 리스코프 치환 법칙 (Effective java 3th - Item10)"
description: "equals 는 일반 규약을 지켜 재정의하라"
date: 2018-11-27
tags: [java, effective]
comments: true
share: true
toc: true
image: '/asset/images/effective/effective.webp'
thumbnail: '/asset/images/effective/effective.webp'
categories: ['Effective Java']
---

## equals 구현 규칙

equals 는 정해진 법칙에 따라 다양한 객체에서 호출되고 있다.

규칙을 지키지 않은 구현으로 의존성 객체에 처리를 맡긴다면, 의도하지 않은 동작이 발생하고 디버깅을 어렵게 만든다.

규칙들은 다음과 같다.

- 반사성
- null은 항상 false
- 대칭성
- 추이성
- 일관성

### 반사성

context 와 null이 아닌 인자가 같을 경우 항상 true 가 된다.

```java
context.equals(context); // true
```

### 대칭성

context 가 어떤 대상 some 과 같다면 그 역방향도 true 가 된다.

```java
context.equals(some); // true
some.equals(context); // true
```

상속관계가 아닌 타입이 다른 객체에서 객체의 equals 비교로 true를 반환하는 구현은 거의 99.99% 대칭성 위반에 걸린다.

### 추이성

말이 어려운데, A와 B가 같고 B와 C가 같다면 A와 C는 같아야 한다는 어디선가 본 논리적 법칙이다.

```java
context.equals(some); // true
some.equals(another); // true
context.equals(another); // true
```

이 구현에서 주의할 것은 상속관계가 얽힐 때다.

특정 클래스를 확장하여 새로운 필드등을 추가한 클래스는 추이성을 만족시킬 수 없다.

특정 클래스를 특정지어 비교하는 방법으로 구현된 equals 의 경우 언뜻 조건 만족을 하는 것 같지만 리스코프 치환 법칙을 위배하기에 쓸 수가 없다.

이 경우에는 [컴포지션](https://www.geeksforgeeks.org/association-composition-aggregation-java/) 을 통해 문제를 해결할 수 있다.

#### 리스코프 치환 법칙

서브타입은 언제나 자신의 상위 타입으로서의 기능을 해야 한다.

만일 상위 클래스가 직사각형이고, 하위 클래스를 정사각형이라고 해보자

```java
@Getter
class Rectangle {

    private int height;
    private int width;

    public Rectangle(int height, int width) {
        this.height = height;
        this.width = width;
    }
    
    public void setSize(int height, int width) {
        this.height = height;
        this.width = width;
    }
}

@Getter
class Square extends Rectangle {

    public Square(int height, int width) {
        super(height, width);
        if(height != width) {
            throw new AssertionException('cannot create!');
        }
    }
    
    public void setSize(int height, int width) {
        if(height != width) {
            throw new AssertionException('cannot create!');
        }
        this.super(height, width);
    }
}
```

직사각형(Rectangle) 은 마음대로 크기 조절이 가능하지만 정사각형(Square) 은 크기 조절에 제약이 있다.

일견 문제가 없어 보이지만 문제는 정사각형이 직사각형의 문맥에서 사용될 때다.

```java
// 직사각형 문맥 로직 수행
public void changeWideSize(Rectangle rec) {
    dim.setSuze(dim.getHeight(), dim.getWidth()); // throw Exception.
}
```

사용자 측에서는 직사각형이라고 생각하고 인자를 처리하고 있다.

하지만 불행히도 객체지향의 인자는 [반공변적(contravariant)](https://edykim.com/ko/post/what-is-coercion-and-anticommunism/)이다. 이 뜻은 인자는 실제 객체의 하위타입이 올 수 있다는 뜻이고, 예제에서는 **직사각형(Rectangle) 뿐 아니라 정사각형(Square)** 도 올 수 있다.

그리고 어떤 객체가 오느냐에 따라 코드의 동작은 변한다. 이럴 경우 리스코프 치환 법칙이 깨졌다고 설명할 수 있다.

### 일관성

몇번을 호출해도 어떤 상황에서 호출해도 두 대상 객체의 내용이 같다면 결과는 항상 같아야 한다.

equals 는 언제나 해당 객체를 대상으로 동치성을 비교해야 하는데, 다른 조건을 참고해가며 비교하게 되면 이 조건이 깨지기 쉽다.

```java
context.equals(some); // true

int i = 10;
while(i > 0) {
    i--;
    try {
        Thread.sleep(1000)
    }
    catch(Exception ignore) {}
    context.equals(some); // true
}
```