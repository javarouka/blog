---
layout: post
title: "[번역] Kotline Coroutine Basic"
description: "코틀린 기본 공식 문서 번역"
date: 2019-08-09
tags: [kotlin, coroutine]
comments: true
share: true
toc: true
image: '/asset/images/rrr.jpg'
thumbnail: '/asset/images/rrr.jpg'
categories: ['kotlin', 'tech', 'translate']
---

# 원문

이 글은 번역글입니다. 오역에 주의하세요.

https://kotlinlang.org/docs/reference/coroutines/basics.html

이 섹션에서는 기본적인 코틀린의 컨셉을 설명한다.

# My First Coroutine

다음 코드를 실행해보라

```kotlin
import kotlinx.coroutines.*

fun main() {
    GlobalScope.launch { // launch a new coroutine in background and continue
        delay(1000L) // non-blocking delay for 1 second (default time unit is ms)
        println("World!") // print after delay
    }
    println("Hello,") // main thread continues while coroutine is delayed
    Thread.sleep(2000L) // block main thread for 2 seconds to keep JVM alive
}
```

> 모든 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-01.kt)에 있다.

코드 실행으로 다음과 같은 결과를 볼 수 있다.

```
Hello,
World!
```

기본적으로 코루틴은 경량 스레드(light-weight thread)이다. 코루틴은 코루틴 스코프의 컨텍스트안의 빌더와 함께 시작된다. 

여기서는 `GlobalScope` 에서 새 코루틴을 시작하고 있다. 이는 새 코루틴의 생명주기가 전체 어플리케이션의 생명주기에 제한된다는 것을 의미한다. 

`GlobalScope.launch { ... }` 를 `thread { ... }` 로 `delay { ... }` 을 `Thread.sleep { ... }` 로 바꿔도 같은 결과를 얻을 수 있다. 한번 해보자.

만일 `GlobalScope.launch` 를 `thread` 로 바꾸려고 하기 시작하면 컴파일러는 다음과 같은 에러를 낸다:

> Error: Kotlin: Suspend functions are only allowed to be called from a coroutine or another suspend function<br/>(에러: 코틀린: Suspend 함수들은 코루틴이나 다른 Suspend 함수에서의 호출만을 허용한다.)

`delay` 는 코루틴 안에서만 사용되는, 코루틴을 중단 (suspend) 하고 스레드를 블럭하지 않는 특별한 `sespending function` 이기 때문이다.

# Bridging blocking and non-blocking worlds

첫 예제는 같은 코드 안에 넌블럭킹(non-blocking) `delay(...)` 와 블럭킹(blocking) `Thread.sleep` 코드가 혼재되어 있다. 무엇이 블럭킹이고 무엇이 아닌지 따라가기 어려울 것이다. `runBlocking` 코루틴 빌더를 사용해서 블럭킹에 대해 명확히 밝혀보자.

```kotlin
import kotlinx.coroutines.*

fun main() { 
    GlobalScope.launch { // launch a new coroutine in background and continue
        delay(1000L)
        println("World!")
    }
    println("Hello,") // main thread continues here immediately
    runBlocking {     // but this expression blocks the main thread
        delay(2000L)  // ... while we delay for 2 seconds to keep JVM alive
    } 
}
```

> 전체 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-02.kt)에 있다

결과는 같지만, 이 코드는 단지 넌블럭킹 `delay` 를 사용한다. 메인 스레드를 실행하는 `runBlocking` 은 `runBlocking` 내부의 코루틴이 완료될 때까지 블럭된다. 

이 예제는 더 관용적 방법으로 재작성할 수 있는데, main 함수 실행을 `runBlocking` 을 사용해 감싸는 것이다:

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking<Unit> { // start main coroutine
    GlobalScope.launch { // launch a new coroutine in background and continue
        delay(1000L)
        println("World!")
    }
    println("Hello,") // main coroutine continues here immediately
    delay(2000L)      // delaying for 2 seconds to keep JVM alive
}
```

> 전체 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-02b.kt)에 있다

여기의 `runBlocking<Unit> { ... }` 은 최상위 메인 코루틴 시작에 사용되는 어댑터로서 작동한다. Unit 반환 형식을 명시적으로 지정하는데, 코루틴의 정상적인 메인 함수는 `Unit` 을 반환해야 하기 때문이다. 

다음은 suspending 함수의 유닛 테스트를 작성하는 방법이다.

```kotlin
class MyTest {
    @Test
    fun testMySuspendingFunction() = runBlocking<Unit> {
        // here we can use suspending functions using any assertion style that we like
    }
}
```

# Waiting for a job

다른 코루틴이 동작할 동안 스레드의 시간을 지연키시는 것은 좋은 접근법이 아니다. 실행된 백그라운드 Job 이 완료될 때까지 명확하게 기다리자:
(역자: 지금까지의 예제 코드가 코루틴이 종료될 때까지 `Thread.sleep` 으로 기다리는 부분을 말하고 있다.)

```kotlin
val job = GlobalScope.launch { // launch a new coroutine and keep a reference to its Job
    delay(1000L)
    println("World!")
}
println("Hello,")
job.join() // wait until child coroutine completes
```

> 전체 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-03.kt)에 있다

여전히 결과는 같지만, 메인 코루틴의 코드는 어떤 방식으로든 백드라운드 job 과 엮이지 않았다. 훨씬 낫다.

# Structured concurrency

코루틴의 일반적이고 바람직한 사용법을 소개한다. `GlobalScope.launch` 을 사용하면 최상위 코루틴을 만든다. 실제 가벼운 동작일지라도, 여전히 동작하는 동안 조금의 메모리를 사용한다. 만일 새로 실행된 코루틴의 참조를 잊어도 코루틴은 여전히 실행된다. 

만일 코루틴의 코드에 행이 걸리는 경우(예를 들면 과도하게 장시간 지연이 발생하는 경우) 나 너무 많은 코루틴이 실행되어 메모리 부족이 오는 경우엔 어떻게 될까?
실행된 코루틴의 참조를 수동으로 유지하고 그것들을 `join` 하는 것은 오류가 나기 쉽다.

좋은 솔루션이 있다. 코드안에서 구조적 동시성을 사용할 수 있다. `GlobalScope` 에서 코루틴을 수행하는 대신, 일반적인 스레드와 함께 실행하는 것 처럼 수행중인 오퍼레이션 안의 특정 스코프에서 코루틴을 실행할 수 있다.

예제에서는 `runBlocking` 코루틴 빌더를 사용하여 코루틴으로 변환되는 메인 함수가 있다. `runBlocking` 을 포함한 코루틴 빌더로 생성되는 모든 코드 블럭 스코프에 `CoroutineScope` 인스턴스를 추가한다. 이 스코프 안에서는 코루틴을 명시적으로 `join` 하지 않고도 실행할 수 있는데, 바깥의 코루틴 (예제의 `runBlocking`) 이 그 스코프 안에서 실행된 모든 코루틴이 완료될 때까지 완료되지 않기 때문이다. 

따라서 예제를 더욱 단순하게 만들 수 있다:

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking { // this: CoroutineScope
    launch { // launch a new coroutine in the scope of runBlocking
        delay(1000L)
        println("World!")
    }
    println("Hello,")
}
```

> 전체 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-03s.kt)에 있다

# Scope builder

다른 빌더가 제공하는 코루틴 스코프 외에, `coroutineScope Builder` 를 사용해서 자신만의 스코프를 가지는 코루틴을 선언할 수 있다.

`coroutineScope Builder` 는 코루틴 스코프를 생성하고 모든 자식들이 완료될 때까지 완료되지 않는다.
`runBlocking` 과 `coroutineScope` 의 주된 차이점은 `coroutineScope` 이 모든 자식이 완료될 때까지 현재 스레드를 차단하지 않는다는 것이다.

(역자: 관련해서 StackOverflow 의 [이 질문](https://stackoverflow.com/questions/53535977/coroutines-runblocking-vs-coroutinescope) 도 한번 보자)

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking { // this: CoroutineScope
    launch { 
        delay(200L)
        println("Task from runBlocking")
    }
    
    coroutineScope { // Creates a coroutine scope
        launch {
            delay(500L) 
            println("Task from nested launch")
        }
    
        delay(100L)
        println("Task from coroutine scope") // This line will be printed before the nested launch
    }
    
    println("Coroutine scope is over") // This line is not printed until the nested launch completes
}
```

> 예제에 대해 말을 덧붙이면, runBlocking 빌더로 생성되어 실행된 코루틴 블럭은 이름 그대로 실행이 안료되기 전까지 블럭되어 스코프를 빠져나올 수 없는 반면, coroutineScope 빌더로 생성되어 실행된 코루틴 블럭은 내부의 자식 코루틴 실행 완료와 관련없이 현재 스레드를 차단하지 않고 스코프를 "탈출" 한다. 예제의 숫자를 바꿔가며 테스트해보면 이해가 빨리 올 것이다.  

> 전체 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-04.kt)에 있다

# Extract function refactoring

`launch { ... }` 안의 코드를 별도 함수로 추출해 보자. 이 코드에 `함수 추출` 리팩토링(역자: Intellij의 기능을 사용한다) 을 하면 `suspend` 수정자와 함께 새로운 함수가 추출된다. 이게 여기서 다루는 첫번째 `suspending function` 이다.

`suspending function` 은 코루틴 안에서 일반 함수처럼 사용될 수 있으며, 추가적인 기능으로 예제의 `delay` 처럼 코루틴 실행을 일시적으로 suspend 할 수 있다.

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    launch { doWorld() }
    println("Hello,")
}

// this is your first suspending function
suspend fun doWorld() {
    delay(1000L)
    println("World!")
}
```

> 전체 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-05.kt)에 있다

그러나 추출된 함수에 현재 스코프에서 호출되는 코루틴 빌더가 포함되어 있으면 어떨까? 이 경우에 추출된 함수의 `suspend` 수정자는 충분하지 않다.

`CoroutineScope` 에서 `doWorld` 를 확장 메소드(extension method) 로 만드는 것은 솔루션 중 하나이지만 API가 더 명확하지는 않으므로 항상 적용 가능한 것은 아니다. 

관용적 솔루션은 대상 함수를 포함하는 클래스의 필드로 명시적 `CoroutineScope` 를 갖거나 외부 클래스가 `CoroutineScope` 를 구현할 때 암시적으로 그것을 필드로 가지는 것이다. 

최후의 수단으로 `CoroutineScope (coroutineContext)` 를 사용할 수 있지만 이 방법으로는 실행 스코프를 더 이상 제어할 수 없기 때문에 이런 접근 방식은 구조적으로 안전하지 않다. 

개인 API 만이 빌더를 사용할 수 있다.

(뭔소리여... 아래 원문 붙임)

> But what if the extracted function contains a coroutine builder which is invoked on the current scope? In this case suspend modifier on the extracted function is not enough. Making doWorld an extension method on CoroutineScope is one of the solutions, but it may not always be applicable as it does not make API clearer. The idiomatic solution is to have either an explicit CoroutineScope as a field in a class containing the target function or an implicit one when the outer class implements CoroutineScope. As a last resort, CoroutineScope(coroutineContext) can be used, but such approach is structurally unsafe because you no longer have control on the scope of execution of this method. Only private APIs can use this builder.

# Coroutines ARE light-weight

다음 코드를 보자

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    repeat(100_000) { // launch a lot of coroutines
        launch {
            delay(1000L)
            print(".")
        }
    }
}
```

> 전체 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-06.kt)에 있다

100K개의 코루틴을 시작하고 1초마다 후에 각 코루틴이 점을 찍는다. 이제 이 로직을 스레드로 시도해보라. 무슨 일이 일어날까? 

(아마도 Thread 를 사용한 코드에서 메모리 부족 오류가 발생할 것이다)

# Global coroutines are like daemon threads

다음 코드는 `GlobalScope` 에서 "I'm sleeping" 을 1초에 두번 인쇄하고 그후 메인 함수에 약간의 `delay` 후 복귀하는 긴 시간의 코루틴을 실행한다:

```
GlobalScope.launch {
    repeat(1000) { i ->
            println("I'm sleeping $i ...")
        delay(500L)
    }
}
delay(1300L) // just quit after delay
```

> 전체 코드는 [여기](https://github.com/kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/jvm/test/guide/example-basic-07.kt)에 있다

실행하고 세줄이 찍히고 중단되는 걸 볼 수 있다.

```
I'm sleeping 0 ...
I'm sleeping 1 ...
I'm sleeping 2 ...
```

GlobalScope에서 시작된 액티브 코루틴은 프로세스를 `실행중인` 상태로 유지하지 않는다. 그것들은 데몬 스레드와 비슷하다.
