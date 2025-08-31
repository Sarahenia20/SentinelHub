import java.io.*;

public class InsecureDeserializationExample {
    public static void main(String[] args) throws Exception {
        // Imagine this byte array came from an attacker
        byte[] data = new byte[] { ... };

        // ❌ Vulnerable: could execute malicious object code
        ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(data));
        Object obj = ois.readObject();

        System.out.println("Object: " + obj);
    }
}
