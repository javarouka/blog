---
layout: post
title: "UCS...Unicode...BMP?"
description: "UCS...Unicode...BMP?"
date: 2011-09-11
tags: [base]
comments: true
share: true
image: 'images/brain.png'
thumbnail: 'images/brain.png'
categories: ['Tech-Piece']
---

## 코드 포인트 : 문자셋의 특정 문자를 지정하는 번호

## USC

> 20억개의 문자 코드 포인트 보유

모든 문자가 가상의 테이블 안에 포함되는데 이 테이블은 128개의 그룹으로 나뉘며 그룹은 다시 256개의 판(Plain)으로 나뉘고 하나의 판 안에는 다시 65535개의 코드 포인트가 있다.

결국 65535개의 문자가 256개의 판에 기록되며 그것을 그룹이라 부른다. 다시 그 그룹이 128개가 뭉치면 UCS 테이블이 된다.

```
65535 * 256 * 128 = 약 20억
```

여기서 최초의 65535 개의 코드 포인트가 할당되는 부분을 기본 언어판(Basic Multilingual Plain === BMP)이라고 부른다.

## Unicode는 UCS의 서브셋이며 호환된다.

Unicode는 UCS중에 그룹 0번의 0번 판부터 16번 판까지만 사용한다.

## Unicode 인코딩

Unicode에 매겨진 코드 포인트가 바이트로 어떻게 표현할 것인지를 나타냄. 

- UTF-32는 코드포인트 값을 그대로 유지하면서 바이트로 표현
- UTF-16은 코드포인트 값을 유지하되, BMP를 벗어난 문자는 32비트로 인코딩한다.
- UTF-8은 코드포인트 값에 따라 1,2,3,4 바이트로 가변 인코딩한다.