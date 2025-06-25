# Co Hacker - a Generative AI Secure code assistant

![alt text](assets/logo.jpg)

## The vision of Co Hacker

**Co Hacker** is a Co-Pilot like vscode extension, made by developers for developers, aiming to capture code vulnerabilities in development time.
It is offering manual and automatic "on the fly" solutions to vulnerable code.

The VSCode extension is a client side application runs in the IDE and sends code snippets to the Co-Hacker server-side application. The server runs an AI Agent to find unsecure, undefined or deprecated logic - and returns a suggested fix to the extension - that offers it to the developer.

More on how the server uses LLM tools like langchain and langgraph for code security analysis can be found in the [Co-Hacker-Server](https://github.com/HeapHopper/co-hacker-server) repository.

## Features

### Inline code security assistant

The inline assistant is the main feature of Co Hacker, providing realtime insights and suggestions for the user code:

#### Code vulnerabilities detection

![alt text](assets/demo_string.gif)

In the example above we can see how the Co Hacker inline assistant detects three different code vulnerabilities in real time:

1. Using `gets(a)` - an unsecure method for input reading without any input length check, prone to cause **Buffer Overflow** vulnerabilities.
    -   The inline assistant offers using `std` method instead.

2. Although `strncpy(dst,src,len)` considered to be a secure method, Co Hacker detects an **Out Of Bounds (OOB)** vulnerability since the `len` used is bigger than `dst` size
   - The inline assistant fixes `len` to be the length of the `dst` buffer -1, as the last byte reserved to the null-terminator.
  
3. Scope awareness - `delete[] a;` is indeed the right way to release buffer `a` memory, but the user did not notice that this buffer was already released, an issue known as **double free** vulnerability.
   - Fortunately - Co Hacker did! and it offers to remove the line, avoiding delete an already deleted variable.

#### Upgrading deprecated code

Old code using deprecated methods can be dangerous just like handling raw memory. This is why the inline assistant not returning just a binary classification if the code is vulnerable or not. It has also a middle option: the code is secure alright, but should be upgraded:

![alt text](assets/demo_auto_ptr.gif)


In the example above, the Co Hacker offers to replace the deprecated STL `std::auto_ptr<>` with the modern replacement `std::unique_ptr<>`.


### Manual code security assistant

It is also possible to use Co Hacker in manual way, selecting a code snippet and asking to get insight about the safety of the code:

![alt text](assets/demo_manual_assistant.gif)


The top function is secure, so no inline suggestions are being made and a pop-up appears to tell the developer that there were no found vulnerabilities.

In the bottom function however, which uses `gets()` - the unsecure function is being replaced with a STL secure alternative.


### Ask AI tab

Sometimes we may want something else than an inline code assistant. Maybe we want to have a "Human" analysis of our code, or maybe we want to ask Co Hacker why a code selection was found vulnerable. We can do this using **Co Hacker - Ask AI** Command:

![alt text](assets/demo_ask_ai.gif)


In this example, we try a manual analysis of the `main()` function and Co Hacker modifies it. But why? after undoing the change we use the Ask Ai command, and in a new tab we have a detailed explanation of the problem in our code.




