---
layout: post
title: "Dependency Inject & Dispatch (Effective java 3th - Item5)"
description: "자원을 직접 명시하지 말고 의존 객체 주입을 사용하라"
date: 2018-11-21
tags: [java, di, double dispatch, effective]
comments: true
share: true
image: '/asset/images/java-logo.png'
thumbnail: '/asset/images/java-logo.png'
categories: ['Effective Java']
---

## 개요

java 객체지향은 많은 모듈들의 의존성으로 이뤄진다.

다만 의존성을 코드상에 명시할 경우 그 의존성이 클라이언트 코드에 강하게 결합되게 된다.

다음과 같은 싱글턴 클래스가 있다.

만화 드래곤 볼에 나오는 드래곤 레이더이다.

```java
public class DragonBallRadar {
    private static final HeightMap heightMap = new EarthMap();
    
    private DragonBallRadar() {}

    public static AttactResult detect() { /* 구현 */ }
}
```

이 드래곤 레이더는 지구에서는 아주 잘 동작할 것이다.
지구에 대한 데이터가 미리 주어지기 때문에 지구에 대해 드래곤 볼의 위치를 잘 표시할 수 있다.

하지만 작중에서 피콜로가 죽고 나메크별로 무대가 옮겨지는 때가 있다. 안타깝지만 부르마와 Z 전사들은 이 드래곤 레이더로 나메크성의 드래곤볼을 찾을 수 없게 될것이다.

이 레이더는 지구맵만 지원하고 있기 때문이다.

`높이맵 (HeightMap)` 을 바꾸기 위해 `setHeightMap` 를 추가할수도 있지만, 싱글톤 객체에 setter 를 추가하는건 멀티환경에서는 오류를 내기 쉽다. 
다수의 스레드의 접근 상태에서 setter 를 호출할 경우 의도하지 않은 오류가 발생할 수 있고 문법적으로 매우 어색하다.

정적 클래스의 메서드는 같은 상태일 때 A 를 호출하면 B 를 받는 순수 함수의 형태가 되어야 옳다.

> 사용하는 자원에 따라 동작이 달라지는 클래스에는 정적 유틸리티 클래스나 싱글턴 방식이 적합하지 않다<br/>-Effective Java 3th 29 page

이 경우에는 사용자 측에서 높이맵을 바꿔줄 수 있어야 한다. 그리고 정적 메서드의 사용도 해서는 안된다.

```java
public class DragonBallRadar {
    private final HeightMap heightMap;
    
    private DragonBallRadar(Supplier<HeightMap> supplier) {
        this.heightMap = supplier.get();
    }

    public static AttactResult detect() { /* 구현 */ }
}
```

간단한 구현으로 스캔을 통해 나메크별의 높이맵 생성 팩토리를 만들어 주입한다면, 이제 프리저보다 먼저 드래곤볼을 찾을 수 있게 되었다.

<!-- Supplier<HeightMap> 의 구현을 나중에 바꿔주는 것만으로 확장성 있게 사용도 가능하다. 생성 시 변수의 레퍼런스(dispatch) 가 두번 일어나게 된다. -->

Spring Framework 를 사용하면서 자연스럽게 쓰고 있을 규칙이지만, 간혹 static 과 의존성을 섞어 쓰는 사례가 있는데 조심해야 한다.

의존성이 추가되기 전에도 정적 메서드는 호출할 수 있으며, Spring Application Context 가 완전히 초기화되기 전에 정적 메서드가 호출된다면 문제가 생길 것이다.

<!-- Spring Framework, Lombok 을 사용한다면 위의 코드를 약간만 수정하면 끝난다.  -->

<!-- ```java
@RequiredArgsConstructor
public class DragonBallRadar {
    private final HeightMap factory;
    public static AttactResult detect() { /* 구현 */ }
}
``` -->
<!-- 
## 주의

다만 잘못된 케이스도 많이 보이는데 아래와 같은 케이스이다.

```java
public ZWarriorStore {

    public static JPARepository repository;

    @PostConstruct
    public void setUp() {
        
    }
}
``` -->