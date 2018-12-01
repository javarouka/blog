---
layout: post
title: "Java HashMap 구현에 대해 (Effective java 3th - Item11)"
description: "equals를 재정의하려거든 hashCode도 재정의하라"
date: 2018-11-28
tags: [java, effective]
comments: true
share: true
toc: true
image: '/asset/images/effective/effective.webp'
thumbnail: '/asset/images/effective/effective.webp'
categories: ['Effective Java']
---

## Map 인터페이스

Map 같은 동작을 하는 키-값의 자료구조는 [연관 배열](https://ko.wikipedia.org/wiki/%EC%97%B0%EA%B4%80_%EB%B0%B0%EC%97%B4)이라고 부르는 자료구조이다. 언어에 따라 Dictionary, Map, Symbol Table 등등으로 바꿔 부르기도 한다.

### JDK 8

[Map Interface(JDK9 기준)](https://docs.oracle.com/javase/9/docs/api/java/util/Map.html) 는 단순하던 JDK 7 구현에서(기본적인 CRUD 성의 메서드 지원만 했다.) `default method` 가 추가된 JDK 8에서는 편의성 메서드들이 대거 추가되었다.

- 편의성을 위해 지정된 값에 대해 일정 연산을 수행하고 그 결과를 갱신하는 compute, computeIfAbsent, computeIfPresent, merge
- 요소를 엔트리로 순회가능한 forEach
- 값을 보고 없으면 두번째 인자를 반환하는 getOrDefault
- 첫번째 인자로 준 키가 없을때만 넣는 putIfAbsent
- 값과 키 둘이 일치해야 삭제하는 remove(key, value)
- 값을 교체하는 replace, replaceAll

이 중 getOrDefault 는 특정 경우에 따라 computeIfAbsent 와 대체해서 코드 량을 더욱 줄일 수 있다.

다음과 같은 코드를 보자. 

키가 문자열이고 리스트가 값인 맵에서 특정 문자열 키의 값이 없다면 해당 값을 기본값을 리스트에 넣고 리스트를 값으로 put 하는 코드이다.

```java
Map<String, List<String>> strListMap = new HashMap<>();

// 기본값 넣기
List<String> list = strListMap.getOrDefault("locale", new ArrayList<>());
list.add("ko_KR");
strListMap.put("locale", list);
```

이 코드를 computeIfAbsent 와 람다로 한줄로 줄일 수 있다.

```java
Map<String, List<String>> strListMap = new HashMap<>();

// 기본값 넣기
strListMap.computeIfAbsent("locale", key -> new ArrayList<>()).add("ko_KR");
```

[Java 8의 람다 함수 살펴보기:성능 비교](https://medium.com/@hun/java-8%EC%9D%98-%EB%9E%8C%EB%8B%A4-%ED%95%A8%EC%88%98-%EC%82%B4%ED%8E%B4%EB%B3%B4%EA%B8%B0-1767d034f962#e8d1) 를 참고해보자.

### JDK 9

JDK 9 에서는 좀더 기능이 확장되어 불변 맵을 생성하는 [of default](https://docs.oracle.com/javase/9/docs/api/java/util/Map.html#immutable) 메서드가 추가되었다.
 
오버로딩이 꽤 많이 되어 최대 인자 20개로 10개까지의 원소를 가지는 맵을 생성할 수 있다. 구현이 너무 정직해서 놀랐다.

[Google Guava](https://github.com/google/guava) 에는 이미 구현되어 있던 기능이다. 그냥 Guava를 정식 라이브러리로 하면 어떨까 싶다.

```java
Map<String, String> immutableMap = Map.of("키1", "값1", "키2", "값2");
```

## Map 의 hash 함수

Java 에서는 hashCode 라는 메서드가 기본적으로 최상위 클래스인 Object 에 존재한다.

이 코드로 Map 에 사용되는 key 를 대체하면 좋겠지만, hashCode 는 int 형이기에 Map 에 저장할 수 있는 객체의 숫자는 2의 32제곱의 사이즈만으로 제한될 것이다. 그렇다고 hashCode 를 long 으로 키워도 문제고, 다른 타입으로 교체할 경우 계산에 따른 성능 문제가 발생할 수 있다. 

이런걸 다 무시하고 억지로 적용한다 쳐도, Map 이 생성될때마다 2의 32제곱의 사이즈만큼의 저장소(버킷이라고 한다)를 초기화해둬야 한다.

그래서 Map 의 버킷은 타협을 일정량의 버킷만 생성하고 몇가지 전략으로 버킷 충돌을 관리한다 (Open Addressing, Separate Chaining). Java 에서 사용하는 버킷 충돌 회피는 Separate Chaining 이며, 버킷을 일종의 LinkedList 로 관리한다.

버킷내의 충돌이 발생하면 기존 key와 신규 key의 equals 호출로 다시한번 중복여부를 검사하여 값을 교체하기에 키가 될 객체 Class 의 equals 구현은 상당히 중요하다.

hashCode 의 구현 규칙에서 `두 객체가 다르더라도 두 객체가 서로 다른 hashCode 를 반환하지 않아도 된다` 라는 건 이 때문이다.

하지만 둘다 다르게 구현하는게 Map의 성능 향상에 크게 도움이 된다. (특정 버킷에 편중되어 저장되는 현상을 회피할 수 있고, 충돌 버킷의 순회 비용이 줄어든다)

위 조건을 만족하는 hashCode 구현을 [완전 해시 함수](https://en.wikipedia.org/wiki/Perfect_hash_function) 라고도 부른다