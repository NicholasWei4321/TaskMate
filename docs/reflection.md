# Project Reflection

## Overview
Overall, I really enjoyed this project. Building TaskMate allowed me to gain valuable experience in building an end-to-end functioning web app and make an interesting service that has practical usage for students. 

For me, the most difficult part of this project was error handling/validation. Due to the project design/topic, there were many, many edge cases that I kept finding the more I tested my service. For example, what should happen if a user attempts to edit a To-do list's start/end dates so that some of the tasks no longer fall within the scope of the list? I had to make sure my system could catch all of these edge cases and display an appropriate error message on the UI instead of just crashing or displaying unexpected behavior. 

The most enjoyable part of the project was when I first saw the frontend come together. It seemed so miraculous that all my backend code, which before I could only write command-line tests for, could all now visibly function in a front-end service. 

## Using the Context Tool
I thought that Context tool was a great way to understand how context affects model output, and it was nice to be able to very clearly specify the context for a particular prompt. However, it was a little cumbersome to use the CLI and have to navigate through a very convluted context history folder. I found it easier to use an existing IDE-integrated agentic coding tool (Cursor). However, I couldn't control the context as well. I think this is probably the biggest thing that I would change in the future. Sometimes, Cursor would get confused if I asked it to do several things at once, and it was much better if I asked it to first read information/instruction documents and plan out a task and do one item at a time.

## Using LLMs for Software Development
Overall, I think LLMs can be extremely helpful for expediting the more cumbersome parts of software development, and they can help make the debugging process much less painful. However, after this very structured project, I realized just how important it is to keep in mind that (at least for now) human programmers/designers still need to have a clear understandig of good software design in order to make sure that LLMs generate clean, modular, "good" code. If I had just blindly attempted to create TaskMate rather than follow the structured steps of first specifying concepts, implementing and testing them, then building the front-end one component at a time, and then understanding the necessity for authentication, I think that the result would have been much messier and prone to failure.

## Conclusions
Yay, I enjoyed this project. I will definitely be using LLMs for coding projects from now on. Importantly, though, I will be much more clear-eyed about proper software design principles, so that I use coding agents appropriately to create high performance products.