---
layout: post
title: "넌 Redux 가 필요 없을지도 몰라"
description: "You Might Not Need Redux 번역 https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367"
date: 2017-03-18
tags: [ ecmascript, javascript, redux, react ]
comments: true
share: true
toc: true
image: 'images/redux/redux-logo.png'
thumbnail: 'images/redux/redux-logo.png'
categories: ['Tech', 'Translate']
---

Dan Abramov 의
https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367
를 번역한 글입니다.

## You Might Not Need Redux

People often choose Redux before they need it.<br/>
사람들은 종종 Redux 가 필요하기도 전에 선택한다.

>“What if our app doesn’t scale without it?”<br/>
앱을 Redux 없이 확장하려면 어떻지?

Later, developers frown at the indirection Redux introduced to their code.<br/>
나중에, 개발자들은 자신의 코드에 Redux 가 도입되어 있는 것들에 눈살을 찌푸리게 된다.

>“Why do I have to touch three files to get a simple feature working?”<br/>
왜 간단한 기능 개발 작업에 세개의 파일을 손대야 하는거야?

Why indeed!<br/>
왜 이런!

People blame Redux, React, functional programming, immutability, and many other things for their woes, and I understand them.<br/>
사람들은 Redux, React, 함수형 프로그래밍, 불변성 그리고 많은 다른 것들이 나에게는 고통이라며 비난하고, 난 그들을 이해한다.<br/>

It is natural to compare Redux to an approach that doesn’t require “boilerplate” code to update the state, and to conclude that Redux is just complicated.<br/>
"보일러 플레이트" 코드를 사용하지 않고 state 를 갱신하는 방법을 비교해본 뒤 Redux 는 단지 복잡하다고 여기는건 당연하기 때문이다.

In a way it is, and by design so.<br/>
어떤 면에서 보면 그건 의도된 설계다.

Redux offers a tradeoff. It asks you to:<br/>
Redux 는 트레이드오프를 제공한다. 그건:

- Describe application state as plain objects and arrays. 일반 객체와 배열로 어플리케이션 상태를 표현한다.
- Describe changes in the system as plain objects. 일반 객체들로 시스템의 변경을 표현한다
- Describe the logic for handling changes as pure functions. 변경 처리를 순수 함수를 사용한 로직으로 표현한다.

None of these limitations are required to build an app, with or without React.<br/>
React 를 사용하든 안하든 이러한 제약들은 앱을 만들때 요구되는 게 아니다.

In fact these are pretty strong constraints, and you should think carefully before adopting them even in parts of your app.<br/>
실제로 이건 정말로 강력한 제약들이며 앱의 일부에 작업할때도 주의깊게 생각해야만 한다.

Do you have good reasons for doing so?<br/>
그런데, 그렇게 할 만한 이유가 있나?

These limitations are appealing to me because they help build apps that:<br/>
이런 제약들은 다음과 같은 앱을 빌드할 때 도움을 주기 때문에 나에겐 매력적이다

- Persist state to a local storage and then boot up from it, out of the box. 앱 상태를 로컬스토리지에 유지하고, 상자 밖에서 시작
- Pre-fill state on the server, send it to the client in HTML, and boot up from it, out of the box. 서버에서 상태를 미리 채우고, HTML 안에 담아 클라이언트에 보내, 상자 밖에서 시작.
- Serialize user actions and attach them, together with a state snapshot, to automated bug reports, so that the product developers can replay them to reproduce the errors. 유저 액션을 시리얼라이즈해서 상태 스냅샷과 함께 자동화된 버그 리포트에 첨부해서, 프로덕트 개발자들이 에러를 재현을 되돌려봄
- Pass action objects over the network to implement collaborative environments without dramatic changes to how the code is written. 액션 네트워크를 통해 액션 객체를 넘겨봄으로써 코드 작성 방법을 드라마틱하게 변경하지 않고 협업 환경 구현
- Maintain an undo history or implement optimistic mutations without dramatic changes to how the code is written. 드라마틱하게 코드 작성 방법을 변경하지 않고 실행 기록 유지나 낙관적인 가변성을 구현
- Travel between the state history in development, and re-evaluate the current state from the action history when the code changes, a la TDD. 개발에서 상태 이력을 여행면서 코드가 바뀌면 액션 이력에서 현재 상태를 계산해봄. TDD로.
- Provide full inspection and control capabilities to the development tooling so that product developers can build custom tools for their apps. 개밸 도구에 전체 검사 및 제어를 제공함으로써 제품 개발자가 앱용 커스텀 도구를 개발할 수 있음.
- Provide alternative UIs while reusing most of the business logic. 대부분의 비즈니스 로직을 재사용하며 다른 UI 를 제공

If you’re working on an extensible terminal, a JavaScript debugger, or some kinds of webapps, it might be worth giving it a try, or at least considering some of its ideas (they are not new, by the way!)<br/>
확장형 터미널, 자바스크립트 디버거, 그리고 일부 앱에서 작업을 한다면 이걸 시도해볼만 한 가지가 있고 최소한 아이디어를 고려해볼만 하다. (이건 새로운 것이 아니다!)

However, if you’re just learning React, don’t make Redux your first choice.<br/>
하지만 React 를 배우는 중이라면 Redux 를 처음부터 선택하지 마라.

Instead learn to think in React.<br/>
리액트로 생각하는 법을 대신 배워라.

Come back to Redux if you find a real need for it, or if you want to try something new. But approach it with caution, just like you do with any highly opinionated tool.<br/>
Redux 가 필요한 진짜 이유를 찾거나, 새로운 무언가를 시도하려고 할때 Redux 로 돌아오라. 그러나 매우 조심스러운 도구를 사용하듯이 주의해서 접근해라.

If you feel pressured to do things “the Redux way”, it may be a sign that you or your teammates are taking it too seriously. It’s just one of the tools in your toolbox, an experiment gone wild.<br/>
"Redux 방식" 으로 일해야 한다는 것에 부담을 느낀다면, 너나 너의 동료들은 그걸 매우 심각하게 받아들인다는 신호일 수 있다. Redux 는 단지 도구 상자의 거친 실험 도구 중 하나일 뿐이다.

Finally, don’t forget that you can apply ideas from Redux without using Redux. For example, consider a React component with local state:<br/>
마지막으로, Redux를 사용하지 않고 Redux 의 아이디어를 적용할 수 있다는 것을 잊지 마라. 예를 들면 로컬 상태의 React 컴포넌트를 고려해보자:

```javascript
import React, { Component } from 'react';

class Counter extends Component {
  state = { value: 0 };

  increment = () => {
    this.setState(prevState => ({
      value: prevState.value + 1
    }));
  };

  decrement = () => {
    this.setState(prevState => ({
      value: prevState.value - 1
    }));
  };

  render() {
    return (
      <div>
        {this.state.value}
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    )
  }
}
```

It is perfectly fine as it is. Seriously, it bears repeating.<br/>
완벽하게 좋다! 훌륭하게 반복성을 유지한다.

(역자 주석: setState 는 객체 외에도, 함수를 받을 수 있습니다. 이 경우 기존의 비동기성 업데이트 대신에 setState 에 전달한 함수들은 큐로 쌓이고 첫 처리된 상태가 두번째 처리에 전달됩니다.)

> Local state is fine.<br/>
로컬 상태는 좋다!

The tradeoff that Redux offers is to add indirection to decouple “what happened” from “how things change”.<br/>
Redux 가 제공하는 트레이드오프는 "상황이 어떻게 변하는지" 에서 "발생한 것" 을 분리하기 위한 간접참조를 추가하는 것이다.

Is it always a good thing to do? No. It’s a tradeoff.<br/>
항상 좋은 걸까? 아니다. 그건 트레이드오프다.

For example, we can extract a reducer from our component:<br/>
예를 들면 컴포넌트에 reducer 를 추출할 수 있다

```javascript

import React, { Component } from 'react';

const counter = (state = { value: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { value: state.value + 1 };
    case 'DECREMENT':
      return { value: state.value - 1 };
    default:
      return state;
  }
}

class Counter extends Component {
  state = counter(undefined, {});

  dispatch(action) {
    this.setState(prevState => counter(prevState, action));
  }

  increment = () => {
    this.dispatch({ type: 'INCREMENT' });
  };

  decrement = () => {
    this.dispatch({ type: 'DECREMENT' });
  };

  render() {
    return (
      <div>
        {this.state.value}
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    )
  }
}
```

Notice how we just used Redux without running npm install. Wow!<br/>
`npm install` 실행 없이 Redux 를 사용한 것에 주목해보라! 와우!

Should you do this to your stateful components? Probably not.<br/>
너의 "stateful 컴포넌트" 에 이 작업을 해야 할까? 아마 아닐거다.

That is, not unless you have a plan to benefit from this additional indirection.<br/>
그건 이 간접적인 참조의 추가에서 얻을 계획이 없다면 아니다.

Having a plan is, in the parlance of our times, the 🔑.<br/>
플랜을 가지는 건 우리 즐거운 시간이다. 🔑.

Redux library itself is only a set of helpers to “mount” reducers to a single global store object.<br/>
Redux 라이브러리는 단지 하나의 전역 store 객체에 reducer들을 탑재한 헬퍼 셋이다.

You can use as little, or as much of Redux, as you like.<br/>
넌 적게 혹은 많게 좋을대로 Redux 를 사용할 수 있다.

But if you trade something off, make sure you get something in return.<br/>
하지만 무언가를 교환한다면, 그 대가로 무언가를 받아라.
