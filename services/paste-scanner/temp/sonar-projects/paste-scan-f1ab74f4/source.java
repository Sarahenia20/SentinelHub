import java.sql.*;

public class SQLInjectionExample {
    public static void main(String[] args) throws Exception {
        String userInput = "' OR '1'='1"; // Malicious input

        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/test", "root", "password");
        Statement stmt = conn.createStatement();

        // ❌ Vulnerable: user input directly in the query
        String query = "SELECT * FROM users WHERE username = '" + userInput + "'";
        ResultSet rs = stmt.executeQuery(query);

        while (rs.next()) {
            System.out.println("User: " + rs.getString("username"));
        }

        conn.close();
    }
}
