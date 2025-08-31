public class CommandInjectionExample {
    public static void main(String[] args) throws Exception {
        String userInput = "&& dir"; // On Windows this could list files

        // ❌ Vulnerable: attacker controls the command executed
        Runtime.getRuntime().exec("ping " + userInput);
    }
}
