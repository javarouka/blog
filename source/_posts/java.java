public static class B {
    private B() {
        System.out.println("B!");
    }
}

public static class A extends B {
    public A() {
        System.out.println("A!");
    }
}

class java {

    public static void main(String... args) {
        System.out.println("a");
        new A();
    }
}