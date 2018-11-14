---
title: 운영되던 서비스, ES5 에서 ES6 으로 옮긴 이야기 2 (feat Webpack)
description: "개고생과 노가다, 그리고 고독"
date: 2017-05-14 23:30:17
tags: [ Handlebars, javascript, webpack, 개고생 ]
image: '/asset/E.N.D.jpg'
thumbnail: '/asset/E.N.D.jpg'
toc: true
categories: ['Tech']
meta:
---

> 2016년 5월부터 2016년 6월까지 진행된 나의 to ES6 삽질을 기록해본다. 100% Real 은 아니고... 95% 정도?

[전 글](/2017/05/03/convert-legacy-to-webpack-bundle-1/)

## 버틸수가 없다

전 포스트의 막바지에 썼듯이 실무는 실전이었다.

다음과 같은 문제를 부딪히며 하나하나 해결해 나갈 수 밖에 없었다.

### 컨트롤러 매핑 문제

requirejs 를 쓰면서 AMD 식으로 필요할 때 스크립트를 로딩했는데, 이 부분부터 고쳐야 했다

Controller 의 이름이 만일 `order/MemberController` 라면 다음과 같은 방법으로 컨트롤러를 로딩한다. 

```javascript
// const controllerPath = 'order/MemberController';
require([`controller/${controllerPath}`], ControllerClass => {
    
    const controlelr = new ControllerClass(contentElement, controllerPath)
    controlelr.execute();
    
});
```

이 방법은 필요할 때 비동기로 네트워크 상에서 스크립트를 로딩하고, 완료 시 콜백 함수의 인자를 통해 모듈을 사용한다

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

저 `ensure` 구문은 반드시 저렇게 패스와 같이 적어줘야지 별도로 분리하게 되면 webpack 번들링 후 실제 로딩이 잘 동작하지 않았다.

컨트롤러 수가 작업 당시에는 그렇게 많지 않았고 동적 로딩 시 종종 Timeout 등의 네트워크 오류도 났기에 그냥 전체를 한번에 번들링해버리는 선택을 했다.
(그리고 나중에 엄청 후회했다...)


#### Webpack2 에서의 Async Module Loading
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
</div>

이제 각 컨트롤러를 매핑해주고 컨텐츠 로더가 그것을 잘 사용할 수 있게 수정하는 노가다만 남은듯 했다.

하지만 현실은 ...

### ES6 모듈과 commonjs, amd 모듈은 달랐다.

Webpack 은 분명 AMD 와 commonjs 모듈도 사용할 수 있다. 실제로도 그렇다.
하지만, 이 두 스펙의 모듈 정의를 ES6 모듈과 함께 사용할때는 큰 문제가 발생했다.

ES6 모듈 정의에는 `default export, named export` 라는 AMD, commonjs 에 없는 개념이 있었기 때문이다.

![뭐냐...](/asset/howthefuck.jpg)

다음에 세가지 스타일로 모듈을 정의해보았다.
이 모듈의 이름은 `rouka/blog/module` 이라고 해보자

먼저, AMD 모듈은 다음과 같은 형식이다.
```javascript
define([ 'jquery', 'moment' ], function factory($, moment) {
    
    const YMD_FORMAT_STR = 'YYYYMMDD';
    
    return {
        getEl(selector, context) {
            return $(selector, context || document);
        },
        
        todayString() {
           return moment().format(YMD_FORMAT_STR);
        }
    };
})
```

commonjs 의 모듈은 다음과 같은 형식이다
```javascript
const $ = require('jquery'); 
const moment = require('moment'); 

const YMD_FORMAT_STR = 'YYYYMMDD';

exports.getEl = function(selector, context) {
    return $(selector, context || document);
};

exports.todayString = function() {
    return moment().format(YMD_FORMAT_STR);
};
```

ES6 모듈은 다음과 같은 형식이다.
```javascript
import $ from 'jquery'; 
import moment from 'moment';

const YMD_FORMAT_STR = 'YYYYMMDD';

export function getEl(selector, context) {
    return $(selector, context || document);
}

export function todayString() {
    return moment().format(YMD_FORMAT_STR);
}
```

여기까지는 세개 다 비슷해 보인다. 모듈을 로딩할때 쓰는 statement 나 문법만 다른 정도.
하지만 위의 정의 모듈을 사용할때 달라진다.

먼저 AMD 와 commonjs 는 기본적으로 형태만 다를 뿐 기본적인 사용은 같다.

모듈을 로딩하고, 해당 모듈을 객체를 얻으면 그 모듈을 사용할 수 있다

```javascript
// AMD
require(['rouka/blog/module'], function(blogModule) {
    console.log(blogModule.todayString()); // 오늘 날자...
});

// commonjs
const blogModule = require('rouka/blog/module')
console.log(blogModule.todayString()); // 오늘 날자...
```

하지만 이 모듈을 ES6 에서 사용하려면 좀 다르다.

```javascript
// ES6
// 이 부분이 다르다!
import { todayString } from 'rouka/blog/module'
console.log(todayString()); // 오늘 날자...
```

import 시에 실제 사용할 기능 프로퍼티 이름을 적어주고 있다.
만일 그냥 

```javascript
// ES6
import blogModule from 'rouka/blog/module'
console.log(blogModule.todayString()); // throw TypeError
```

이런식으로 사용할 경우 오류를 낸다.

위의 문법은 `rouka/blog/module` 에서 default 모듈을 사용하겠다는 뜻이다.
ES6 모듈에는 `default export` 라는게 있다.

```javascript
import $ from 'jquery'; 
import moment from 'moment';
    
export function getEl(selector, context) {
    return $(selector, context || document);
}

export function todayString() {
    return moment().format(YMD_FORMAT_STR);
}

// default export
export default function setTodayOnEl(selector, context) {
    getEl(selector, context).html(todayString());
}
```

default export 로 해당 엘리먼트에 오늘 날자를 HTML 로 넣어주는 함수를 정의했다.

```javascript
// default 모듈 사용
import setTodayOnEl from 'rouka/blog/module'
console.log(setTodayOnEl('body')); // 오늘 날자...

// ........................

// 명시적으로 사용
import { setTodayOnEl } from 'rouka/blog/module'
console.log(setTodayOnEl('body')); // 오늘 날자...

// ........................

// 혼용해서 사용. 앞이 default
import setTodayOnEl, { todayString } from 'rouka/blog/module'
console.log(setTodayOnEl('body')); // 오늘 날자...
```

실제 Babel 은 ES6 모듈과 이외 모듈을 다른 방식으로 컴파일하는데, ES6 의 모듈일 경우에는 `__esModule` 이라는 마크를 해 두고 import 구문을 만날 경우 다른 방식으로 import 를 수행한다.

Controller 모듈을 기본적으로 ES6 으로 변경하고 있었는데 이 경우 Controller 를 commonjs 나 amd 모듈이 import 할 경우

추가적으로 default 프로퍼티로 접근해야 했다.

```javascript
// ./es6.style.module' 모듈은
// named export 와 default export 가 섞여있다.
var es6Module = require('./es6.style.module');

// 이 반환된 모듈 안은
// { default: doSome, otherSome } 같은 형식이다.

// 물론 doSome 사용에는 default 프로퍼티가 필요하다.
es6Module.default.doSome();

// named export 모듈은 그냥 사용한다
es6Module.otherSome();
```

실제 프로젝트에 적용 시 세가지 스타일의 모듈 정의가 뒤섞여 작업되고 있었고,

각 모듈마다 모듈 사용에 있어 각기 다른 방법으로 사용해야 하는 지경에 이르르니, 거의 수라계에 온 듯한 느낌을 받게 했다.

webpack 에서 뱉어내는 빨간색 천지의 오류 메시지와 함께 내 마음도 붉게 물들기 시작했다

![아...그냥 그만두고 여길 나갈까](/asset/doc-heatal.jpg)

<div style="padding: 0 5px; background-color: #ECECEC; border-top: solid 1px #333; font-size: 80%;">
위의 ES6 및 commonjs 모듈의 다른 점을 알고 싶다면 엑셀박사님의 블로그를 한번 읽어보자.<br/>
<a href="http://2ality.com/2015/12/babel-commonjs.html" target="_blank">[Babel and CommonJS modules]</a>
</div>

### 결국, 개발된 모든 파일을 ES6 으로 변환~!

여러 꼼수를 써보다가, 결국 선택한건 모든 파일에 대해 ES6 스타일로 코드를 변환하는 것으로 선택했다.

프로젝트 내에서 한가지 스타일로 코딩이 되어 있어야 하는건 당연한 것이고, 기왕이면 표준 스펙으로 선택하는 것이 유리했으며,

ES6 모듈을 적용하면 Dead Code Elimination(Tree Shaking) 이라는 최적화 전략까지 쓸 수 있기 때문이었다.

[Tree Shaking](https://github.com/rollup/rollup#tree-shaking)

Tree Shaking 은 요약하면 모듈 import 최적화로 실제 컴파일 시 모듈 import 에서 사용하는 코드만 컴파일 결과에 포함시키는 것이다.

당연히 용량이 작아지고 연산이 줄어든다.

암튼 나는 당시 900 개가 넘는(...) js 코드들을 하나하나 열어서 ES6 스타일의 모듈 코드로 변환하기 시작했다.

정말 즐거운 일이었다.

## 개발서버와 번들서버

스크립트를 동적으로 컴파일한다는건 파일이 작을땐 별 문제가 되지 않는다.

하지만 프로젝트의 규모가 나름 컸으므로 생성된 파일은 상당히 많았고, 이 파일을 실제 컴파일하여 실제 파일을 만들어내는 데에는 2~3 분의 시간이 걸렸다.

뭐 배포 전 한번이라면 괜찮다.

하지만 이 것이 watch 등으로 코드 수정시마다 일어난다고 할 경우에는 문제가 심각해진다.

webapack 은 `webpack dev server` 를 제공했고, 이것을 사용할 경우 파일을 실제 Disk 에 생성하는게 아닌 메모리에 생성하고 그것만을 갱신하기에 속도가 상당히 빠르다.

설정은 예제 사이트들이 아주 잘 되어있어서 그것을 가져다가 쓰면 되었다.

여기에 express 를 사용해서 Data Server 를 Proxy 로 감싸서 쓰게 되면 로컬에 별도의 java 를 구동하지 않고도 사용할 수 있어서 클라이언트 개발에는 순수하게 webpack-dev-server 만으로도 충분하도록 설정했다.
(뭐 결국 서버까지 손대는 일이 부지기수지만...갑작스러운 오류 등으로 클라이언트에 대해 디버깅하기에는 엄청나게 유용했다.)

[express-http-proxy](https://www.npmjs.com/package/express-http-proxy) 를 사용해서 정적 리소스 외에는 프록시로 이미 구동중인 서버로 요청을 하게 했다.

프록시-번들서버 코드는 매우 간단하다.

```javascript
import proxy from 'express-http-proxy' // 이놈이 효자
import Express from 'express'

export default function startProxyServer() {
    
    const delegateServer = new Express();
    
    // 프록시 서버 정보
    const proxyServer = 'localhost';
    const proxyPort = 11980;
    
    // 번들서버 정보
    const bundleServerHost = 'localhost:11980';
    
    // API 서버 정보
    const targetServer = 'myproject.companydev.com';
    
    // 번들서버 요청
    delegateServer.use('/resources/*/bundles/:name', proxy(bundleServerHost, {
        forwardPath(req) {
          return '/bundles/' + req.params.name;
        }
    }));
    
    // 이 외의 요청은 Proxy 를 통해 설정된 서버로.
    delegateServer.use('/', proxy(targetServer));
    
    // 시작~
    delegateServer.listen(proxyPort, err => {
        if (err) {
            console.error(err);
            reject(err);
        } 
        else {
            console.info('Webpack development proxy server progress... %s', `http://${proxyServer}:${proxyPort} to ${targetServer}`);
            resolve();
        }
    });
}

```

`webpack-dev-server` 를 구동할때 프록시 개발서버까지 같이 돌려주면 완벽.
 
이제 남은건 실제 배포 환경이었다.

## 실제 배포환경

실제 운영 환경에서는 번들서버같은걸 띄울수도 없고 띄워서도 안된다.

운영시에는 메모리에 존재하는 스크립트가 아니라 실제 파일을 만들어야 해서 별도로 webpack 설정을 production 용으로 하나 만들고 이 설정에서는 별다른 번들서버나 프록시, 기타 개발 서포트 플러그인을 제외하고 구성했다.

개발에는 없던 [UglifyPlugin](https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin) 옵션을 추가해서 소스를 압축했다.

사내에서는 빌드에 `gradle` 을 사용하고 있었기에 다음과 같은 구문을 넣어서 `gradle` 의 `war task` 수행 전 `npm` 을 사용해서 소스를 컴파일하고 파일을 지정된 위치에 생성되게 했다.

```groovy
apply 'war'

task packageClient (type : Exec) {
	executable "${project.projectDir}/packageClient.sh" // npm 빌드 스크립트
}

// 여기~
war.dependsOn packageClient
```

## 끝났나

검색 -  삽질 - 노가다 - 삽질 - 검색의 무한루프를 돌며 변환이 끝났다. 

이 작업은 기존의 잘 돌아가던 시스템을 다시 엎은거라서, 잘 되어야 본전인 일이라 사실 티는 그다지 나지 않았다.
중간에 몇가지의 문제로 압박받은것만 많았고...

게다가 모든 코드를 한번에 로딩하는 방법을 선택해서, 스크립트 용량이 상당히 거대해져버린 문제는 과제로 남았다.

최근 webpack 2가 나오면서 webpack 1 이 deprecated 되었다. 다시 설정을 만질 때가 온 듯 하니 같이 작업하면 될 듯 하다.