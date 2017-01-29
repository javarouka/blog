---
layout: post
title: "Java 버전별 같은 상황 다른 코딩"
description: "뭐가 더 좋은거지...?"
date: 2017-01-30
tags: [ci,github,opensource]
comments: true
share: true
image: 'asset/java-logo.png'
thumbnail: 'asset/java-logo.png'
categories: ['Tech', 'Java', '코딩스타일']
---

<!-- toc -->

## Java 8

개인적으로는 Java 8 은 예전에 Java 1.4 에서 1.5 로 넘어가는 것 만큼의 임팩트가 있다고 생각한다.
Java8은 최근 전염병(?) 처럼 번지고 있는 함수형 스타일을 적극적으로 도입하였다.

로직을 인자로 주고받을 수 있는 *Lambda Expression*, Java판 trait이라고 할 수 있는 *default method*. [Type Annotation](https://blogs.oracle.com/java-platform-group/entry/java_8_s_new_type) 의 추가도 신기하고, 가독성 면에서 상당히 좋은 *Stream* 도 재미있다.

이런 새로 등장한 Feature들을 여러 삽질을 거듭하며 프로젝트에 적용해보고 있는데, 몇가지 반복되는 케이스가 있어 정리해본다.

아직 뭐가 좋은 방법인지는 잘 모르겠고, 애초에 시작이 틀렸을 수도 있지만 그건 그거 나름대로 알 수 있다면 다음 포스팅에라도 차차 정리해보겠다.

## 리스트 안의 객체들에 대한 조작이 필요할 때

프로젝트를 하면서 자주 마주치는 작업이 있다. 특히나 MSA 를 사용하고 있는 회사에서는 더욱 잦다. 그건 바로 특정 데이터 컬렉션에 대해 하나하나 작업이 필요할 때다.

이럴 경우 기본 데이터 셋과 다른 데이터 셋과의 부분적 merge 가 필요하다.

코드로 써보면

```java
// 문의 기본 데이터를 빌드한다.
// 여기엔 상담 도메인 측에서의 기본 데이터만 들어있다.
List<ContactUs> targetList = buildBasicContactUsList(1, 10);

// 얻어온 문의 데이터에서 멤버 아이디 셋을 추출해서 API 를 요청한다.
// 여기서부터 부분의 로직이 다분히 반복적이다
final Set<String> userIds = targetList.stream()
  .map(ContactUs::getTargetMemberId)
  .collect(toSet());

final List<User> fromApi = findMembers(userIds);

// 얻어온 유저 데이터를 문의 데이터에 merge 한다.
// 이 부분도 굉장히 반복적이다.
populateUserName(targetList, fromApi);
```

저 메서드에서 하는 작업은
