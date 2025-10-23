---
timestamp: 'Wed Oct 22 2025 19:32:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251022_193247.f5aa8eeb.md]]'
content_id: 909bd1a423e823ddd8b2ea1ebf328973b51aa88f7c168c5c2f46ad08d52759c7
---

# response:

Here is a formal concept specification for a `TodoList` concept:

**concept** TodoList \[User, Item]

**purpose** enable users to organize items into named collections and manage those collections and their contents

**principle** If a user creates a named list and adds several items to it, they can later retrieve that list by its name and see all the items they added.

**state**
  a set of Lists with
    name: String
    owner: User
    items: set of Item

**actions**
  createList (owner: User, name: String): (list: List)
    **requires** for all existing L in Lists, if L.owner == owner then L.name != name
    **effects** create a new List L\_new;
                set L\_new.owner := owner;
                set L\_new.name := name;
                set L\_new.items := {};
                return L\_new

  createList (owner: User, name: String): (error: String)
    **requires** exists L in Lists such that L.owner == owner and L.name == name
    **effects** return "A list with this name already exists for this user."

  addListItem (list: List, item: Item)
    **requires** list exists AND item is not in list.items
    **effects** list.items := list.items union {item}

  removeListItem (list: List, item: Item)
    **requires** list exists AND item is in list.items
    **effects** list.items := list.items difference {item}

  deleteList (list: List)
    **requires** list exists
    **effects** remove list from the set of Lists

**queries**
  getListsForUser (user: User) : (list: List)
    **requires** true (assuming 'user' is a valid, externally managed User identifier)
    **effects** returns the set of all Lists L where L.owner == user
