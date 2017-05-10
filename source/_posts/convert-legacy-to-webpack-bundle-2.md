---
title: 운영되던 서비스, ES5 에서 ES6 으로 옮긴 이야기 #2 (feat Webpack)
description: "개고생과 노가다, 그리고 고독"
date: 2017-05-11 23:30:17
tags: [ Handlebars, React, 개고생 ]
image: '/asset/E.N.D.jpg'
thumbnail: '/asset/E.N.D.jpg'
categories: ['Tech']
meta:
---

<!-- toc -->

> 2016년 5월부터 2016년 6월까지 진행된 나의 to ES6 삽질을 기록해본다. 100% Real 은 아니고... 95% 정도?

[전 글](/blog/2017/05/03/convert-legacy-to-webpack-bundle-1/)

## 버틸수가 없다

전 포스트의 막바지에 썼듯이 실무는 실전이었다.

다음과 같은 문제를 부딪히며 하나하나 해결해 나갈 수 밖에 없었다.

### 1. 컨트롤러 매핑 문제

requirejs 를 쓰면서 AMD 식으로 필요할 때 스크립트를 로딩했는데, 이 부분부터 고쳐야 했다

Controller 의 이름이 만일 `order/MemberController` 라면 

```javascript
// const controllerPath = 'order/MemberController';
require([`controller/${controllerPath}`], ControllerClass => {
    
    const controlelr = new ControllerClass(contentElement, controllerPath)
    controlelr.execute();
    
});
```

라는 식으로 동적으로 스크립트를 로딩했지만...
일단은 기본적으로 모든 모듈이 바로 접근 가능해야 하는 ES6의 모듈은 이런것을 허용하지 않았다.

결국 아래와 같은 controllerMap 을 만들었다

```javascript
// @file controllerFactory.js
import EmptyController from './EmptyController'
import MainController from './OrderController'
import OrderController from './order/OrderController'
import MemberController from './member/MemberController'
import MemberBlockController from './member/MemberBlockController'

// ... Controller import Statement 다수

const controllerMap = {
    
    'MainController': MainController,
    'order/OrderController': OrderController,
    'member/MemberController': MemberController,
    'member/MemberBlockController': MemberBlockController,
    
    // ...
};

// 이름으로 매핑해둔 컨트롤러를 반환한다.
export default function(conrollerPath) {
    return controllerMap[conrollerPath] || new EmptyController();
}
```

이런식으로 미리 Controller 모듈을 로딩해두고 맵으로 관리되게 한 다음, 반환하는 Factory 모듈을 만들어서 처리했다.

동적 로딩을 완전히 포기하고 초기에 모든 스크립트를 로딩하게 한 선택이다.

물론 초기 스크립트 로딩 용량이 굉장히 커지고 컨텐트와 컨트롤러가 추가될수록 증가하지만, 별 방법이 없다고 생각했다.

[require.ensure](https://webpack.github.io/docs/code-splitting.html) 를 사용하여 동적 로딩을 선택할 수도 있었지만 동적 로딩도 동적 문자열로 모듈을 로딩하는건 불가능하기에, 각 컨트롤러의 매핑마다 동적 로딩 코드를 적어주어야 했다.

다음과 같이 말이다. 별로 마음에 들지 않았다.

```javascript
// @file asyncControllerFactory.js
import EmptyController from './EmptyController'

const controllerMap = {
    
    ['MainController']() {
        return new Promise(resolve => {
            require.ensure([], () => resolve(require('./MainController')))
        })
    },
    ['order/OrderController']() {
        return new Promise(resolve => {
            require.ensure([], () => resolve(require('./order/OrderController')))
        })
    },
    
    // ...
};

export default function(conrollerPath) {
    const factory = controllerMap[conrollerPath];
    return factory ? 
        factory().then(Controller => new Controller().execute())
        :
        Promise.resolve(new EmptyController().execute());
}
```

저 `ensure` 구문은 반드시 저렇게 패스와 같이 적어줘야지 별도로 분리하게 되면 webpack 이 잘 동작하지 않았다.

컨트롤러 수가 작업 당시에는 그렇게 많지 않았고 동적 로딩 시 종종 Timeout 등의 네트워크 오류도 났기에 그냥 전체를 한번에 번들링해버리는 선택을 했다.
(그리고 나중에 엄청 후회했다...)

#### 번외

Webpack 2 에서는 `import` 와 `async/await` 를 사용해서 동적 로딩을 할 수 있다.

이런식의 코딩이 가능. 표준을 준수한다는 것 외엔 특별한 외형 차이는 없다.

```javascript
// ES7 의 async 와 await 를 사용한다
async function loadOrderCancelController() {
    const Controller = await import('./OrderCancelController');
    return Controller;
}

loadOrderCancelController()
    .then(Controller => new Controller().execute());
```

이제 각 컨트롤러를 매핑해주고 컨텐츠 로더가 그것을 잘 사용할 수 있게 수정하는 노가다만 남은듯 했다.

하지만 현실은 ...

### 2. ES6 모듈과 commonjs, amd 모듈은 달랐다.

Webpack 은 분명 AMD 와 commonjs 모듈도 사용할 수 있다. 실제로도 그렇다.
하지만, 이 두 스펙의 모듈 정의를 ES6 모듈과 함께 사용할때는 큰 문제가 발생했다.

ES6 모듈 정의에는 `default` 라는 AMD, commonjs 에 없는 개념이 있었기 때문이다.

![뭐냐...](/blog/asset/howthefuck.jpg)

## 개발서버와 번들서버

## 실제 배포환경

## 팀내 서포트

## 결론
