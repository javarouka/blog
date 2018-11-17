---
layout: post
title: "Handlebars (for Java) 서버, 클라이언트 동시에 사용하기"
description: "Handlebars (for Java) 서버, 클라이언트 동시에 사용하기"
date: 2014-05-24
tags: ['java', 'javascript', 'template']
comments: true
share: true
image: 'images/brain.png'
thumbnail: 'images/brain.png'
categories: ['Tech-Piece']
---

## 웹 템플릿 엔진

웹 템플릿 엔진은 비슷한 구조의 View가 묶여지는 데이터에 의해 바뀔 수 있는 텍스트를 (보통은 HTML) 생성해주는 엔진을 가르키는 것이라고 볼 수 있다.

자바 개발자라면 JSP 가 아주 친숙한 템플릿 엔진일 것이다. 이 외에도 Apache Velocity, Jade, FreeMarker 등등 템플릿의 종류는 꽤 많다.

최근에는 서버에서 동작하는 템플릿 이외에도 클라이언트에서 동작하는 템플릿 엔진이 인기인데, 모바일 환경으로 넘어오며 더욱 중요해지고 있다. 

- 서버의 부담 감소
- 적은 트래픽으로 컨텐츠 서비스
- 클라이언트 캐시 사용 용이
- 서버사이드와 클라이언트 사이드의 개발을 병렬로 진행할 수 있는 이점

이러한 점 때문에 앞으로도 인기는 꽤 많을듯 싶다.

최근 클라이언트 사이드 프레임워크들은 자체 템플릿 엔진을 가지고 나오는 경우가 많으며, 거의 대부분의 서버사이드 템플릿 엔진은 클라이언트에서도 사용할 수 있도록 나오는 경우가 많다.

[템플릿 엔진 셀렉터](http://garann.github.io/template-chooser/)

최근 회사 프로젝트(Java 기반이다) 에 적극적으로 적용하고 있는데 개인적으로는 꽤 만족하며 사용하고 있다. 처음 적용하면서는 꽤 어려움을 겪었는데 그 중 하나가 서버와 클라이언트에서 동시에 사용할 때 였다. 게다가 RequireJS 와 같이 사용할때 도 함정이 있었다.

## 서버와 클라이언트 동시 사용

템플릿 엔진들이 그렇듯이 바뀌는 동적 부분에 나름대로의 문법 치환자를 제공하고 그 부분에 데이터가 엮이며 치환되는 방식이다. 템플릿의 로직 지원여부에 따라 제어문이나 수식이 들어가기도 한다.

템플릿에 따라서는 아예 언어 레벨의 스크립틀릿 을 지원하기도 (JSP, PHP,  EJS  등) 하지만,  최근 추세는  logic-less 로 템플릿의 로직에 제약을 거는게 대부분이다.

Handlebars도 예외가 아니라서 스크립트릿따위 없다. 심지어 단순한 if condition, loop 구문도 제약이 굉장히 심한 편이다.

```xml
<ul>
    {{#orders}}
        <li data-order-id="{{orderId}}">{{productName}}</li>
    {{/orders}}
</ul>
```

이 템플릿에 컨텍스트를 지정하기 전에 일단 컴파일이 필요하다.

Spring Framework 을 사용하는 서버 환경에서는 대부분 컴파일 과정을 프레임워크 레벨에서 처리하므로 데이터만 묶으면 되지만 Spring Framework 등의 Framework를 사용하지 않는 환경은 반드시 텍스트를 생성하기 위해 해당 환경에서 처리 가능한 형태로 변환하는 컴파일 작업이 사전에 수행되어야 한다.

템플릿 엔진의 작업은 다음과 같이 진행된다

1. 템플릿 엔진이 템플릿을 읽는다
2. 해당 환경에서 실행할 수 있게 템플릿을 컴파일한다.
3. 컨텍스트를 지정해 텍스트로 변환한다

JavaCode 로 표현하면 다음과 같은 식이다.

```java
TemplateLoader loader = ClassPathTemplateLoader();
loader.setPrefix("/views");
loader.setSuffix(".hbs");

Handlebars handlebars = new Handlebars(loader);

// /views/orderList.hbs
Template template = handlebars.compile("orderList");

List<orderdto> orderList = getOrderList();

// orderList를 Context 로 사용
System.out.println(template.apply(orderList));
```

다음과 같은 결과텍스트가 나온다

```xml
<ul>
    <li data-order-id="10031231">내주문</li>
    <li data-order-id="10031232">다른사람주문</li>
</ul>
```

하지만 여기서 문제가 발생한다.

## 문제

서버와 클라이언트에서 동시에 Handlebars 를 사용하려고 할 경우 치환자의 문제가 생긴다

가령 이러한 템플릿을 두고 사용하려고 한다고 가정해보자

```xml
<-- 이 부분은 클라이언트에서 사용할 템플릿 -->
<script id="invoice-template" type="text/template" >
<table>
    {{#each this}}
        <tr>
            <td class="dateformat">{{createdAt}}</td>
            <td>{{createdBy}}</td>            
            <td>{{action}}</td>
            <td>{{returnDeliveryType}}</td>
            <td>{{editColumn}}</td>            
        </tr>
    {{/each}}
</table>
</script>

<-- 이 부분은 서버에서 컴파일 될 템플릿 -->
<div>
    <h1>{{reportName}}</h1>
    <p>{{author}}</p>
    <div id="relivery-report-table-area"></div>
</div>

<-- 클라이언트 템플릿을 사용해서 그려보자 -->
<script type="text/javascript" >

    var templateHtml = jQuery("#invoice-template").html();
    var template = Handlebars.compile(templateHtml);

    var invoiceList = Invoice.getDeliveryData();
    var invoiceListHtml = template(invoiceList);

    jQuery("#relivery-report-table-area").html(invoiceListHtml);

</script>
```

스크립트에서 클라이언트 템플릿을 사용하려고 하지만 서버에서 치환자들이 다 치환되어 버린 상태이기 때문에 템플릿 컴파일이 아무 의미가 없어진다. 혹은 이미 서버에서 주어진 컨텍스트에 클라이언트에서 사용하려 한 변수들이 없기에 NullPointerException 을 내고 있을 것이다.

서버와 클라이언트가 같은 치환자 문자열인 {{expression}} 을 쓰기 때문이다.

## Helper precomplie / embedded

둘의 제일 큰 차이는 서버에서 클라이언트에서 사용할 수 있게 컴파일을 미리 해두느냐 하지 않느냐의 차이이다.

먼저 precompile Helper 를 써보자.
위의 코드중 JavaScript 에서 사용할 템플릿을 별도 파일로 분리하자.

그리고

```xml
<script type="text/javascript">{{precompile 분리한 파일 경로 문자열}}</script>
```

과 같이 지정한다.

주의할 점은 스크립트 태그로 반드시 감싸야 하며, 타입은 text/javascript 로 지정해야 한다.

```xml
<-- 
    이 부분은 클라이언트에서 사용할 템플릿.
    precompile Helper 를 사용했다.
-->
<script type="text/javascript">{{precompile "precompiles/invoiceNumbers"}}</script>

<-- 이 부분은 서버에서 컴파일 될 템플릿 -->
<div>
    <h1>{{reportName}}</h1>
    <p>{{author}}</p>
    <div id="relivery-report-table-area"></div>
</div>

<-- 클라이언트 템플릿을 사용해서 그려보자 -->
<script type="text/javascript" >

    // 컴파일 과정이 필요없이 핸들바의 키로 잡힌다.
    var template = Handlebars.templates['precompiles/invoiceNumbers.hbs'];
    
    var invoiceList = Invoice.getDeliveryData();
    var invoiceListHtml = template(invoiceList);
    jQuery("#relivery-report-table-area").html(invoiceListHtml);

</script>
```

위의 결과로 서버에서는 JavaScript 에서 진행 될 템플릿 컴파일의 소스를 생성해서 내려주며 결과는 다음과 비슷한 구조가 된다.

```xml
<-- 
    이 부분은 클라이언트에서 사용할 템플릿.
    precompile Helper 를 사용했다.
-->
<script type="text/javascript">
var template = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
    var stack1, functionType="function", escapeExpression=this.escapeExpression,
        self=this, blockHelperMissing=helpers.blockHelperMissing;

    function program1(depth0,data) {

        var buffer = "", stack1, helper, options;
        buffer += "\r\n";
        if (helper = helpers.createdAt) {
            stack1 = helper.call(depth0, {hash:{},data:data});
        }
        else { helper = (depth0 && depth0.createdAt);
            stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper;
        }
        buffer += escapeExpression(stack1)
            + "\r\n";
        if (helper = helpers.createdBy) { stack1 = helper.call(depth0, {hash:{},data:data});
        }
        else { helper = (depth0 && depth0.createdBy);
            stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper;
        }
        buffer += escapeExpression(stack1)
            + "\r\n";
        if (helper = helpers.action) { stack1 = helper.call(depth0, {hash:{},data:data});
        }
        else { helper = (depth0 && depth0.action);
            stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper;
        }
        buffer += escapeExpression(stack1)
            + "\r\n";
        if (helper = helpers.returnDeliveryType) {
            stack1 = helper.call(depth0, {hash:{},data:data});
        }
        else {
            helper = (depth0 && depth0.returnDeliveryType);
            stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper;
        }
        buffer += escapeExpression(stack1)
            + "\r\n";
        if (helper = helpers.editColumn) {
            stack1 = helper.call(depth0, {hash:{},data:data});
        }
        else { helper = (depth0 && depth0.editColumn);
            stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper;
        }        
        return buffer;
    }
    stack1 = helpers.each.call(depth0, depth0,
        {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
    if(stack1 || stack1 === 0) { return stack1; }
    else { return ''; }
});
var templates = Handlebars.templates = Handlebars.templates || {};
templates['precompiles/invoiceNumbers.hbs'] = template;
var partials = Handlebars.partials = Handlebars.partials || {};
partials['precompiles/invoiceNumbers.hbs'] = template;
</script>

<-- 이 부분은 서버에서 컴파일 될 템플릿 -->
<div>
    <h1>{{reportName}}</h1>
    <p>{{author}}</p>
    <div id="relivery-report-table-area"></div>
</div>

<-- 클라이언트 템플릿을 사용해서 그려보자 -->
<script type="text/javascript" >

    // 컴파일 과정이 필요없이 핸들바의 키로 잡힌다.
    var template = Handlebars.templates['precompiles/invoiceNumbers.hbs'];
    
    var invoiceList = Invoice.getDeliveryData();
    var invoiceListHtml = template(invoiceList);
    jQuery("#relivery-report-table-area").html(invoiceListHtml);

</script>
```

뭔가 복잡한 코드로 변경되어 서버가 브라우저에 응답했다.

코드 내용에 주의를 기울일 필요가 없다.
중요한 건 저 코드가 컴파일 과정을 실행하며, 결과가 Handlebars.template 속성의 키로 지정된다는 것과 사용할때 컴파일 과정을 건너뛰고 컨텍스트만 지정해주면 된다는 사실이다.

반면 embedded Helper 를 사용하면 다음과 같은 응답이 온다.

```xml
<-- 
    이 부분은 클라이언트에서 사용할 템플릿.
    embedded Helper 를 사용했다.
-->
<script type="text/javascript">
<table>
    {{#each this}}
        <tr>
            <td class="dateformat">{{createdAt}}</td>
            <td>{{createdBy}}</td>            
            <td>{{action}}</td>
            <td>{{returnDeliveryType}}</td>
            <td>{{editColumn}}</td>            
        </tr>
    {{/each}}
</table>
</script>

<-- 이 부분은 서버에서 컴파일 될 템플릿 -->
<div>
    <h1>{{reportName}}</h1>
    <p>{{author}}</p>
    <div id="relivery-report-table-area"></div>
</div>

<-- 클라이언트 템플릿을 사용해서 그려보자 -->
<script type="text/javascript" >

    // 컴파일 과정이 필요없이 핸들바의 키로 잡힌다.
    var template = Handlebars.templates['precompiles/invoiceNumbers.hbs'];
    
    var invoiceList = Invoice.getDeliveryData();
    var invoiceListHtml = template(invoiceList);
    jQuery("#relivery-report-table-area").html(invoiceListHtml);

</script>
```

별도로 분리한 파일이 그대로 변환없이 클라이언트까지 내려온다.

물론 embedded 를 사용할 일은 거의 없다고 볼 수 있다. 서버측 컴파일을 거쳐오면 클라이언트에서 컴파일을 할 필요가 없어지기에 좀더 빠르게 클라이언트에서 템플릿을 표현할 수 있으며 코드도 간단해진다.

클라이언트 템플릿 엔진이 Handlebars.js 가 아니거나 Handlebars.js 를 늦게 인클루드 할 경우에나 소용이 있을 듯 싶다.

그런데 또 하나 문제가 있다.

precompile 을 적용하게 되면 사용자의 브라우저가 해당 precompile된 블럭을 읽기 전 Handlebars.js 가 로딩되어야 한다.

이것에서 문제가 발생한다.

## RequireJS와 함께일 경우

최근엔 JS 부분이 중요해짐에 따라 수많은 스크립트들의 의존성을 해결해주고 모듈화를 적용하는 경우가 많아졌다. 그중 하나가 AMD방식의 모듈 로딩이며 그 중에서도 RequireJS 가 자주 사용되는 듯 하다.

만일 precompile 과 RequireJS로 Handlebars 를 로딩하고 있다면 비동기 모듈 로딩 특성상 반드시 오류가 난다.

precompile은 전역에 이미 Handlebars 객체가 있다고 가정한 상태로 템플릿 컴파일 결과를 응답하며, 이 시점에 클라이언트는 아직 Handlebars 객체가 존재하지 않는다.

당연히 스크립트 오류가 발생한다.

물론 precompile 블럭이 오기 전에 미리 스크립트 태그로 로딩하면 되지만 RequireJS 환경에서 스크립트를 태그로 불러오는 건 그리 할만한 일이 아니다.

물론 해결책이 있다.

Handlebars Java  버전은 wrapper 속성으로 amd 방식의 컴파일도 지원한다. 헬퍼 옵션에 wrapper="amd" 속성을 주면 끝이다.

precompile 경로가 그대로 RequireJS 모듈 이름으로 등록되며 그 이름으로 모듈을 로딩하면 컴파일 된 템플릿을 사용할 수 있다.

```xml
<script type="text/javascript">{{precompile "precompiles/invoiceNumbers" wrapper="amd"}}</script>
```
이 경우 클라이언트에 내려오는 컴파일 코드의 내용이 다음과 같이 AMD 형식으로 래핑된다.

```javascript
define('precompiles/invoiceNumbers.hbs', ['handlebars'], function(Handlebars) {

    // ... 컴파일 된 소스

    return template;

}
이제 amd 로 로딩하여 사용하면 된다! 
require(["jquery", "order", ""], function($, OrderModule, invoiceTpl) {

    "use strict";

    var $area = $("div[data-orde-area]"),
        data = OrderModule.getOrderData();

    $area.html(invoiceTpl(data));

});
```

wrapper 속성은 amd 외에도 anonymous, none 이 있다.

anonymous 는 익명 함수로 컴파일 소스 실행부를 감싸는 방식이며, none 은 기본값으로 전역 스코프에서 컴파일 과정을 처리한다.