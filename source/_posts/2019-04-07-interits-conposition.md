---
layout: post
title: "Java / Kotlin 의 상속과 구성 (Inheritance & Composition) #1"
description: "자바와 코틀린에서 본 상속과 구성에 대한 개인적 정리 #1"
date: 2019-04-07
tags: [java, kotlin, composition, delegate]
comments: true
share: true
toc: true
image: '/asset/images/rrr.jpg'
thumbnail: '/asset/images/rrrr.jpg'
categories: ['java', 'kotlin']
---

# 자바의 상속

객체지향언어에서의 상속은 객체간의 관계를 언어레벨에서 정의하는 방법이다.

상속은 [Simula](https://ko.wikipedia.org/wiki/시뮬라) 라는 언어의 객체지향적 부분에서 발전했다고 알려져 있다. C++ 개발자인 [비야네 스트로스트롭](https://ko.wikipedia.org/wiki/비야네_스트롭스트룹)이나 Java 개발자인 [제임스 고슬링](https://ko.wikipedia.org/wiki/제임스_고슬링)도 Simula 에서 언어 개발에 상당한 아이디어를 얻었다고.

Java 의 상속은 다음과 같은 성격을 지닌다

## 수퍼/서브클래스
어떤 클래스 B 가 다른 클래스 A 를 상속할 때 A를 수퍼클래스, B 를 서브클래스라고 한다. 간혹 수퍼타입/서브타입으로도 부르기도 하는데 다소 다른 의미다.

아래 코드에서 `Truck` 은 `Car` 의 서브클래스이기 때문에 자동차가게(CarStore) 에 `Truck` 을 둘 수 있다. 하지만 `Ship` 은 둘 수 없다.

```java
class Ship {}
class Car {}
class Truck extends Car {}

class CarStore {
    private Set<Car> carList = new HashSet<>();
    public void put(Car car) {
        carList.add(car);
    }
}

public class MainClass {

    public static void main(String... args) {
        CarStore shop = new CarStore();
        shop.put(new Car());
        shop.put(new Truck());
        shop.put(new Ship()); // 컴파일 에러. 배는 차가 아니다.
    }
}
```

상속관계인 클래스 `Car` 와 `Truck` 은 서로 각자의 타입이면서 클래스이다.

그렇다면 왜 타입과 클래스를 정확하게 구분해야 하는가. 그것은 *하나의 클래스는 대부분 두가지 이상의 타입으로 표현* 될 수 있기 때문이다.

### 타입과 클래스

아래 예제를 보면, `Truck`의 인스턴스는 `Truck`, `Car` 타입이 될 수 있다. `Truck` 은 두가지의 타입을 가지고 있다.

```java
Car car = new Car();
Truck truck = new Truck();
Car truckCar = truck; // 가능하다.
```

Java 의 모든 클래스는 Object 를 상속하므로, Object 타입으로도 표현할 수 있다.

게다가, 제네릭 클래스는 타입 인자에 따라 수많은 타입을 만들어낼 수 있다.

```java
ArrayList<Object> objs = new ArrayList<Object>();
ArrayList<Car> cars = new ArrayList<Car>();
ArrayList<Truck> trucks = new ArrayList<Truck>();
```

- 클래스는 구현 지향적이다. 내부 상태와 할 수 있는 연산이 구현되어 수행하는 자료구조에 가깝다.
- 타입은 선언 지향적이다. 특정 객체가 수행할 수 있는 일의 제한을 지정한다.

<p align="center">
    <img src="/asset/images/truck.jpg" alt="트럭"><em>아마존 트럭. 트럭이고 차이고 기계이다.</em>
</p>

## 타입 관계

서브클래스는 수퍼클래스 타입의 변수에 할당할 수 있다. 서브클래스는 수퍼클래스의 모든 기능을 상속받았고 수퍼클래스가 할 수 있는 모든 일을 할 수 있으므로, 부모 타입이 할 수 있는 모든걸 할 수 있게 구현되어야 한다. [리스코프 치환 원칙](https://blog.javarouka.me/2018/11/27/object-equals-liskov/#%EB%A6%AC%EC%8A%A4%EC%BD%94%ED%94%84-%EC%B9%98%ED%99%98-%EB%B2%95%EC%B9%99) 으로도 부른다.

이러한 타입 관계에서는 `변성(variance)` 이라는 성질이 존재한다. 메서드의 인자로 전달된 객체의 상태가 변할땐 자신의 타입을 포함한 수퍼타입으로 제한되고, 특정 객체를 반환할 경우 반환형은 자신의 서브타입으로 제한된다.

1. 특정 메서드에게 걸그룹을 인자로 전달하려면 특정 메서드의 선언은 걸그룹이거나 걸그룹의 수퍼타입(가수, 사람, 동물 ...)이어야 한다.
2. 특정 메서드에서 걸그룹을 반환할 경우 그 반환값은 걸그룹이거나 걸그룹의 서브타입(트와이스, 소녀시대 ...)이어야 한다.

좀더 유식하게 표현하면 1번의 경우를 [반공변적](https://medium.com/@lazysoul/%EA%B3%B5%EB%B3%80%EA%B3%BC-%EB%B6%88%EB%B3%80-297cadba191)이라고 하고 2번의 경우를 [공변적](https://edykim.com/ko/post/what-is-coercion-and-anticommunism/)이라고 한다.

<p align="center">
    <img src="/asset/peoples/twice.jpg" alt="트와이스"><em>트와이스는 걸그룹이지만 소녀시대는 아니다.</em>
</p>

### Java 의 변성

Java 에서는 배열의 제네릭 파라미터일 경우 이 관계를 와일드카드와 함께 써서 `PECS (Producer-extends, Consumer-super)` 로 정의한다.
예외가 있다면 배열인데, 이는 과거 설계의 실수를 호환성 이슈로 수정할 수 없는 것이고 배열의 타입은 조심히 다뤄야 한다.

```java
// 공변 제네릭 리스트
List<? extends GirlGroupSinger> girlGroups1 = new ArrayList<>();

// 이 문은 컴파일 오류이다. 이 값이 어떤 값인지 특정지을 수 없다.
girlGroups1.add(new Twice());
girlGroups1.add(new Sistar());

// 걸그룹임이 보장된다.
GirlGroupSinger some = girlGroups.get(0);

// 반공변 제네릭 리스트
List<? super GirlGroupSinger> girlGroups2 = new ArrayList<>(); 

// 걸그룹의 수퍼타입이면 뭐든 입력할 수 있다
girlGroups1.add(new People());
girlGroups1.add(new Animal());

// 이 문은 컴파일 오류이다. 이 타입이 무엇인지 특정지을 수 없다.
GirlGroupSinger some = girlGroups.get(0);
```

이와 관련해서 몇몇 Java의 책에서는 상한(super)/하한(extends)이라는 용어로 설명되기도 한다

> 이 주제와 관련해서 좋은 StackOverflow 링크가 있다. https://bit.ly/2GdGEUh

## 자동 선언

서브클래스는 수퍼클래스의 인스턴스 변수와 멤버 메서드들을 자동으로 상속한다. 

상속한다는 뜻은 서브클래스에서 별도로 정의하지 않아도 정의된 것처럼 별도 선언 없이 사용할 수 있다.

*인스턴스 변수*, *멤버 메서드* 라고 명시적으로 말한 건 static 으로 정의된 변수와 메서드는 제외되기 때문이다.

수퍼클래스에 대한 접근은 `super` 키워드를 사용한다. 

super 키워드는 사용처에 따라 다른 대상을 가르키는데 생성자에서 사용되는 super 는 *생성자 함수* 가르킨다. 

멤버 함수에서의 `super` 는 인스턴스를 가르킨다. 그래서 둘의 사용법이 다소 다르다. 생성자에서의 `super` 는 바로 호출하는 함수 형태이고, 메서드에서의 `super` 는 부모 인스턴스를 레퍼런스하는 변수처럼 동작한다.

## 접근제어 

상속에 몇가지 제약을 걸 수 있는 접근제어자가 있다.

Java 를 처음 학습할때 접하는 `private`, `protected`, `public` 이고 별도로 정의하지 않으면 `default` 접근제어가 적용된다.

보통 좋은 프로그램 코딩 가이드에서는 제한적인 접근을 먼저 적용하고 필요에 따라 넓혀가라고 조언된다. `private` 으로 전부 선언한 뒤, 필요에 따라 `protected` 혹은 `public` 으로 넓혀가는게 좋다. 

애매한 건 `default` 접근 제어인데 이 케이스는 일반적인 케이스의 경우 잘 사용되지 않지만, 구현체를 직접적으로 사용하지 못하게 할때 유용하게 쓸 수 있다.

만일 같은 패키지에 `UserInputController` 클래스와 `UserInputController` 을 상속한 `Mouse` 클래스, `Keyboard` 클래스가 있다고 할 때 타 패키지에서는 `UserInputController` 으로만 추상적으로 접근하게 하고 싶다면 다음과 같이 구현하면 된다

```java
// @file UserInputController.java
package me.javarouka.input;
public interface UserInputController {}

// @file Mouse.java
package me.javarouka.input;
class Mouse implements UserInputController {}

// @file Keyboard.java
package me.javarouka.input;
class Keyboard implements UserInputController {}
```

외부에서는 클래스를 생성하지 못한다. *private 생성자* 로도 이런 방법을 쓸 수 있지만, DI 프레임워크(Spring Framework 가 대중적이다.) 등을 쓰고 있다면 이 방법이 유용할 것이다.

# 결론

다음 포스트에서는 상속의 단점과 구성에 대해 알아보겠다. 그리고 코틀린에서 이 것을 어떻게 우하하게 처리하는지 알아본다 
