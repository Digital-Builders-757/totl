# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e4]:
      - link "TOTL Agency" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "TOTL Agency" [ref=e6]
      - button [ref=e7] [cursor=pointer]:
        - img [ref=e8]
  - generic [ref=e10]:
    - link "Back to login" [ref=e11] [cursor=pointer]:
      - /url: /login
      - img [ref=e12]
      - text: Back to login
    - generic [ref=e15]:
      - generic [ref=e16]:
        - img "TOTL Agency" [ref=e17]
        - heading "Reset Password" [level=1] [ref=e18]
        - paragraph [ref=e19]: Enter your email address and we'll send you a link to reset your password.
      - generic [ref=e20]:
        - generic [ref=e21]:
          - text: Email
          - textbox "Email" [ref=e22]:
            - /placeholder: Enter your email
        - button "Send Reset Link" [ref=e23] [cursor=pointer]
```