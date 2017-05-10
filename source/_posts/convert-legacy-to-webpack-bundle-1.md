---
title: 운영되던 서비스, ES5 에서 ES6 으로 옮긴 이야기 1
description: "개고생과 노가다, 그리고 고독"
date: 2017-05-03 23:30:17
tags: [ Handlebars, React, 개고생 ]
image: '/images/react.png'
thumbnail: '/images/react.png'
categories: ['Tech']
draft: false
meta:
---

<!-- toc -->

> 2016년 5월부터 2016년 6월까지 진행된 나의 to ES6 삽질을 기록해본다. 100% Real 은 아니고... 95% 정도?

## 프로젝트의 안정화 마무리 즈음의 위험한 만남

회사에 입사한 뒤로 내가 주로 한 일은 통으로 되어있던 프로젝트에서 내가 소속된 팀의 기능만 빼서 별도의 프로젝트로 분리하는 일이었다.

[MSA](http://microservices.io/) 로의 이전을 위해 한창 전사가 달리던 때다.

내가 속해있던 팀은 기존의 Spring + MyBatis 에서 Spring + JPA 를 적용하여 새로 프로젝트를 구성하였고 개발은 그럭저럭 마무리가 코 앞으로 다가왔다.

이때 쯤 신기술이 유행하고 있었는데 ~

> ECMAScript, React

React 라는 녀석과 함께 ES6 의 유혹은 매우 강렬했다.

그리고 개발자라면 신기술을 써보고 싶은 욕심같은게 부글부글 끓어올랐다;

사실 난 이 전까지는 JavaScript 의 Source to Source Compile 에 대한 거부감이 상당했고 그동안 별 불편함을 느끼지 못해 그냥 무시해왔지만, 한번 맛을 들이고 나니 이놈들은 끊을 수 없는 콜라같은 마력을 뿜어냈다

선행 학습 후 관련 스터디와 예제 코드를 몇번 직접 작성해 본 결과, 이건 바로 적용하고 싶다는 고집이 고개를 훅 들기 시작했고 실 프로젝트에 적용해 보기로 마음먹었다.

## 기존 구조는 AMD + Handlebars

하지만 기존에 완성되어 가던 프로젝트는 프로젝트 초기에 열심히 나름대로 세팅한 AMD 기반으로 동적으로 서버에서 Handlebars 컴파일 된 HTML 을 로드하고 그것을 화면에 innerHTML 등으로 붙여넣어 처리하는 구조였다.

동적으로 컨텐트와 그에 맞는 스크립트를 로딩하는 간단한 프레임워크였는데, 간간히 발생하는 모듈 Timeout 만 아니면 나름 잘 동작했다.

뭐 요약하면, Rouka Framework 0.0.1 정도 되려나.

간단히 소개하면 이런 구조다.

1. hash url 기반의 SPA 다
1. 컨텐츠가 요청되면 서버에서는 server side의 handlebars 를 사용하여 완성된 html을 응답한다.
1. 그 응답 html 의 루트 엘리먼트에는 data-controller 라는 속성이 optional 로 있다.
1. 그 속성은 실제 js 파일의 경로이며 require(경로) 를 통해 실제 그 컨텐츠가 사용할 Controller.js 를 동적 로딩한다
1. 그 컨트롤러 파일은 로딩된 컨텐츠의 엘리먼트 레퍼런스를 가지고 UI의 이벤트 및 초기화를 수행한다.

```javascript
function getViewEL() {
    // ... 동적 디스플레이 뷰 영역 반환
}

/**
 * HTML 컨텐트 생성
 */
function createContentWrapper(html) {
    var wrap = document.createElement('DIV');
    wrap.innerHTML(html);
    getViewEL().appendChild(wrap);
    return wrap;
}

/**
 * 이 부분이 핵심.
 * 컨트롤러 속성을 가져와서 해당 컨트롤러 모듈을 로딩한다.
 */
function loadController(wrap) {
    return new Promise( function( resolve ) {

        var contentEl = wrap.querySelect('[data-controller]');
        if(!contentEl) return resolve(contentEl);

        var controllerPath = contentEl.dataset.controller
        if(!controllerPath) return resolve(contentEl);

        require(['controller/' + controllerPath], function(Controller) {
            var controller = new Controller(contentEl, controllerPath);
            controller.execute();
            resolve(contentEl);
        });

    });
}

function reportError() {
    // ...컨트롤러 에러 보고
}

function ajax(path) {
    // ...서버에 컨텐트 요청
}

function loadContents(path) {
    ajax(path)
        .then(wrapContent)
        .then(loadController)
        .catch(reportError)
}


// 새 페이지 요청
loadContents('/where/are/you');
```
글을 읽다보면, 이 코드가 나중에 어떻게 바뀌는지 보게 될 것이다.

실제 코드는 이보다 훨씬 여러 상황을 고려했고, pre, post 등의 Hook 과 Attribute-Auto-Event-Bind 기능이 붙어있지만 뭐 이 글에선 중요한게 아니니

## 개별 파일을 일일히 컴파일

이 상황에서 나는 ES6의 매력에 빠져 Babel 을 사용하여 ES6/React 를 적용하기 시작한다.

처음에는 Webpack 이 그리 정돈되지도 않았고, 학습이 좀 어려워(라는 핑계로) 개별 파일을 [jsx 컴파일러 (Facebook 에서 제공하던 ES6/React 컴파일러. 지금은 Deprecated 되었다)](https://facebook.github.io/react/jsx-compiler.html) 를 사용하였다.

그리고 일일히 파일 하나하나를 트랜스파일하여 js 를 두개를 커밋하였는데, 이 과정에서 일어나는 비효율성은 엄청났지만, 드디어 ES6/React 의 코드의 결과물은 나에게 멋지게만 보였다.

![wow](/blog/asset/mywow.jpg)

### IntelliJ File Watcher!

하지만 매번 커맨드라인으로 일일히 컴파일하는 작업은 고역이었고, 실수라도 컴파일하지 않은 코드를 올리는 순간 클라이언트에서 사용할 수 없는 문법 오류가 속출했다. 실수로 올라간 트랜스파일되지 않은 상태로 ES6 이나 JSX 문법을 사용한 파일을 구동하면 브라우저가 이해하지 못하는 것이었다.

이런 도중에 팀 동료의 도움을 받아 [Intellij 의 File Watcher](https://www.jetbrains.com/help/idea/2017.1/using-file-watchers.html)를 추가하여 코딩과 동시에 Transpiling 되는 기능을 적용했다.

별도로 커맨드라인을 수행할 필요도, js 파일을 생성할 필요도 없이 jsx 파일만 코딩하면 자동으로 js 파일이 트랜스파일링되어 생기는 점은 너무 편했고, 이내 이 툴로 드디어 production 에 몇몇 기능을 개발하여 적용하게 되었다.

하지만 이건 불행의 전주곡의 시작이었다.

### 괴롭다..

![어째 잘못된 길을 든듯한...](/blog/asset/otl.jpg)

한계가 매우 빠르게 느껴졌다.
크게는 다음과 같은 것들이 막 앞통수 뒤통수를 서라운드로 타격하기 시작했다.

그 중 크리티컬 히트를 자주 터뜨리는 녀석들은 다음과 같았다.

- 개별 컴파일로 인한 기반 코드가 모든 파일에 삽입. (modules, createClass 등의 유틸성 코드 등)
- OS 및 로컬 Babel, Jsx 컴파일러 버전, Babel 플러그인 설정마다 미묘하게 다른 코드 생성
- 컴파일 된 파일을 실수로 Commit 하지 않으면 장애로 연결되는 등의 소스파일 이중관리
- 다량의 파일 변경 이력을 pull, checkout 등을 통해 겪을 경우 intellij 가 file watcher 과부하로 intellij 가 수분(심하면 5분이상)정도 멈춤

이대로는 더이상 개발이 힘들어졌고, 나는 결국 애써 외면하던 외부 Source to Source Compile 도구를 찾게 되었다.

### Webpack & Browserify

정확히 말하면 Source to Source Compiler 를 사용한 번들 도구 (bundle tool)를 찾았다.

위의 크리티컬한 이슈를 처리하기 위해서는 어쩔 수 없이 source 전체적인 번들 및 변환이 필요했기 떄문이다.
또한 [Intellij 의 File Watcher](https://www.jetbrains.com/help/idea/2017.1/using-file-watchers.html) 가 지원하던 개발의 편의성 또한 필요했다

소스를 고칠때마다 매번 수동으로 컴파일하기는 너무 번거로웠다.

기본적인 Source to Source Compile 이 동작하고, 번들링 기능에, 가급적 소스를 고칠 때 자동으로 백그라운드에서 시스템이 자동으로 최신 내역을 Compile 하는 Watch 기능은 없어서는 안됐다.

찾아보니 두개가 있었다.

- Webpack
- Browserify

>이 둘 관련으로 좋은 글 하나 링크한다.
[Browserify VS Webpack - JS Drama](http://blog.namangoel.com/browserify-vs-webpack-js-drama)

##### Browserify

[Browserify](http://browserify.org/) 는 NPM 생태계의 모듈들을 브라우저에서 사용하는 것을 목표로 하는 도구다.

코드를 CommonJS 문법으로 작성해두면 npm 의 모듈들을 바로 브라우저 환경에서 돌려볼 수 있고, Watchify, Factor Bundle, deAMDFy 등의 도구로 파일 감시, 멀티 번들, AMD 지원등이 가능하다.

제일 좋은 점은 아주 적은 설정으로 바로 시작할 수 있다는 점이지만, 다른 Task 도구를 사용하지 않으면 사용이 조금 불편할 수 있어서 추가적인 Task Runner(주로 [Gulp](http://gulpjs.com/)) 설정이 들어가게 된다.

##### Webpack

[Webpack](https://webpack.github.io/) 은 Browserify 와는 다르게, 혼자서 할 수 있는 일이 거의 없다.

대부분 별도의 loader 라 부르는 모듈과 그 모듈을 적용할 대상을 지정해주는 설정을 같이 요구한다.

commonjs 를 사용하려면 babel-loader 를 설치하고 설정해야 하며, React 를 사용하려면 babel-loader 의 설정에 react 관련 플러그인의 추가 및 설정이 필요하다.

다만 webpack 은 정적 리소스까지도 다룰 수 있는 loader 를 제공하며, hot-loading 등의 강력한 기능까지 붙여볼 수 있다.

별도 Task Runner (gulp 등) 없이 혼자서도 전부 할 수 있는 것도 장점이다.

## 인생은 실전

선택에는 고민자체가 필요없었다.

NodeJS 모듈을 만들것도 아니고, 정적 파일 관리까지 지원하며 부가적인 기능들이 더욱 막강한 Webpack 으로 정했다.

먼저 간단한 Webpack 을 학습하기 위해 bolierplate 코드를 받아서 이리저리 변경해보았다.

[boilerplate](https://github.com/geniuscarrier/webpack-boilerplate)

역시나 모든 툴들이나 신기술이 그렇듯 hello world 수준의 사용법은 너무나 간단하고 쉬웠다.

대충 학습을 끝내고 바로 프로젝트에 적용해보기 시작했다.

예상대로 실제 프로젝트,
그리고 이제 어느정도 커져버려서 꽤나 규모가 있는 프로젝트에는 문서대로의 친절함따윈 없었다.

나는 야생의 아마존에 버려진 만나는 모든게 두려운 고양이가 된 느낌을 받기 시작했다.

기존에 사용하던 AMD 툴인 requirejs 를 너무 헤비하게 쓰고 있었던 것이다.

path의 정리나 controller 의 로딩이 순식간에 전부 작업분으로 남아버렸고, 몇몇 기능이나 모듈은 새빨간 컴파일 오류를 내기 바빴다.

내용이 길어저 [2부](/blog/2017/05/11/convert-legacy-to-webpack-bundle-2/)로 나눈다.
