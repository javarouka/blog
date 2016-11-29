---
layout: post
title: "PKI - Public Key Interface"
description: "PKI 에 대한 간단한 정리"
date: 2016-11-15
tags: [ crypto, security ]
comments: true
share: true
image: 'images/learncomputer-programing.jpg'
thumbnail: 'images/learncomputer-programing.jpg'
categories: ['Tech', 'Security']
---

<!-- toc -->

## PKI(Public Key Interface)

- 암호화는 코드 및 암호를 통해 정보를 보호하는 기술이다.
- 코드는 정보 변경 방법을 모르는 상태로 읽을 수 없도록 하기 위해 정보를 체계적으로 변경하는 프로세스이다.

정보를 코드로 변경하는 작업을 **"암호화"**, 코드를 정보로 되돌리는걸 **"해독"** 이라고 한다.

암호화를 할때 사용된 수단 혹은 정보를 키라고 하며 이때 사용된 방식을 암호화 알고리즘이라고 한다.

정리하면

- 암호화 : 정보를 코드로 변환
- 해독 : 코드를 정보로 변환
- 키 : 정보를 코드로 변환할 때 사용된 정보
- 암호화 알고리즘 : 정보를 코드로 변경할 때 사용된 방식

예를 들어...

> A는 "Hello World" 라는 정보를 B에게 전송한다.
이때 A는 암호화 키로서 l이라는 알파벳을 모두 A로 바꾸는 키를 사용하였고 이걸 심플 알고리즘이라고 이름붙였다.
B는 코드로서 "HeAAo WorAd" 라는 코드를 받았다. 애초에 서로 가진 키와 알고리즘을 통해 이 코드는 A를 l로 바꾼 것임을 알고, 암호 해독을 실행하여 "Hello World" 라는 정보를 얻어냈다.

이러한 암호화 방식을 대칭 키 암호화라고 한다.
A와 B가 동일한 키를 가지고 있기 때문이다. 심플하지만 이것이 앞으로 나올 암호화의 기본이 된다.

좀더 발전된 형태의 암호화가 선보였는데, 1976년에 Whitfield Diffe 와 Martin Hellman 에 의해 공개 키 암호화가 발표되었다.
이 암호화는 두개의 키를 사용한다.

 - 하나는 개인키(비밀키)로서 오로지 자신만 소유한다.
 - 하나는 공개키(공유키)로서 외부에 공개해 둔다.
 - 두개의 키는 수학 알고리즘으로 묶여 있다.

이제 다시 예를 들자.

1. A는 B에게 메시지를 보내기 위해 B에게 공개키를 요구한다.
2. B는 A에게 자신이 가진 개인키와 쌍을 이루고 있는 공개 키를 공개하고,
3. A는 그 키를 받아 B에게 보낼 정보를 암호화하여 코드로 만든다.
4. B는 코드를 받으면 자신의 개인 키로 해독, A가 보내려 했던 정보를 볼 수 있다

이 암호화 방식으로 얻어지는 이점은 정보의 교환 말고 여러가지가 있다.

그중 대표적인 건 **디지털 서명** 이라는 송신자를 확인할 수 있는 이점이다.

개인키는 오로지 하나의 소유자만이 소유할 수 있기에 만일 개인키로 암호화한 코드는 그 개인이 암호화했다는걸 증명하는 서명과 같이 동작한다.

디지털 서명의 방법의 플로우는

정보를 자신의 개인키로 암호화하여 암호화문과 별도로 메시지 헤더등에 추가한다. 이걸 서명이라고 한다.

그리고 보낼 사람의 공개키로도 정보를 암호화한다.

받는 측은 메시지 송신자의 진위여부를 파악하기 위해 송신자의 공개키로 헤더의 서명 암호화를 해독한다. 그리고 정보또한 자신의 개인키로 해독한다.

두 내용이 일치하면 송신자가 조작되지 않았음을 알 수 있다.

여기서...정보 외에 헤더에 추가하는 서명은 부하등의 이유로 먼저 본문을 약속된 해시 알고리즘으로 해쉬한뒤 서명을 생성하는게 보통이다.

여기서 주의할 점이 있다.

일반적인 공개키 암호화 방식은 복잡한 수학 연산에 의해 부하가 상당하다.
이 부하를 피하기 위해서 대칭키 암호화와 섞어 사용하는게 보통이다.

그렇다. 공개키 암호화 방식으로 대칭키 자체를 암호화해 보내는 방법이다.

키 자체만을 암호화하기 때문에 부하가 상대적으로 비용이 적다.

## 결론

여기까지 설명한 방법을 모두 합친 암호화 및 서명 플로우는 다음과 같다.

1. 정보를 해시한뒤 그 값을 자신의 개인키로 암호화한다.
2. 그 결과를 보낼 메시지에 추가한다. 이것을 서명이라고 한다.
3. 일회용의 대칭키를 생성한다.
4. 대칭키로 정보를 암호화하여 보낼 메시지에 추가한다.
5. 받는 사람의 공개키를 획득한다.
6. 받는 사람의 공개키로 일회용의 대칭 키를 암호화한다.
7. 그 결과를 보낼 메시지에 추가한다.
8. 수신자는 메시지에서 서명, 암호화된 일회용 대칭키, 암호화된 코드를 확인하고 분리한다.
9. 수신자의 개인키로 암호화된 일회용 대칭키를 해독한다.
10. 해독된 대칭 키로 코드를 해독한다.
11. 보낸 사람의 공개키를 획득한다.
12. 서명을 보낸 사람의 공개키로 해독하고 그 결과를 위에서 해독된 코드의 정보를 해시하여 비교한다.
13. 값이 일치하면 메시지와 송신자가 유효한 것이 증명된다.