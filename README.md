# Al' Dente - Mobile app for restaurants
![Al Dente Restaurant app logo](https://github.com/kashann/aldente-restaurant-client/blob/master/Restaurant/Resources/drawable/aldente.png?raw=true)
### Everyday restaurant problems
- How fast can a waiter deliver the menus to the customers?
- How long can he wait to write down the order?
- How often does it happen for the waiter to deliver wrong orders?
- How good can a waiter describe the menu items?
- How fast can a waiter attend the client that flagged him?
- How frequently can you change the menu content?
- How is the waiter’s time wasted when he could attend other customers?

### The solution to restaurant problems
- Android based system with cross-platform deployment possibilities (Xamarin)
- Cost efficient
- Reduces the reliance on manpower
- Increases the order accuracy
- Minimizes the waiting times
- Digital menu that can be easily changed
- Enhances the dining experience (self-ordering & self-billing)

### General description of the architecture
The “Al Dente Restaurant Solutions” app suite has a client – server architecture. From a logic point of view, there can be 2 types of clients. The restaurant client’s tablet app, and the waiter’s app. The restaurant clients will only be able to send data to the server (the orders, requests of waiter service or bill), while the waiters will be able to both send data (change the status of the table) and receive data (orders from the customers) from the server.

<!--```mermaid-->
<!--graph TD
A(Server with MySQL db) --> <!--B((Local Network))-->
<!--B --> <!--C(Client Tablets)-->
<!--B --> <!--D(Waiter Smartphones)-->
<!--B --> <!--E(Kitchen Display Screen)-->
<!--```-->
The server has the role of storing the data used by both clients. This data can be static, as the table numbers, or dynamic, as the status of the table or the order content. The server centralizes the data and it makes it available for the clients though URIs.

<!--```mermaid
sequenceDiagram
Client --> <!--Restaurant App: *Recieves tablet*
	loop Until complete
		Client ->> Restaurant App: Add order item
	end
Client ->> Restaurant App: Confirm order
Restaurant App ->> Waiter: Send order
Restaurant App --><!--> Kitchen: Send order
Kitchen ->> Waiter: Prepares order
Waiter --><!--> Client: Serve order
Client ->> Restaurant App: Request Waiter service
Restaurant App ->> Waiter: Notify "Table nr. Z needs assistance"
Waiter --><!--> Client: *Table service*
Client ->> Restaurant App: Check + Payment
Restaurant App ->> Payment Processor: Process payment
Payment Processor --><!--> Restaurant App: OK
Restaurant App ->> Waiter: Confirm payment
Waiter --><!--> Client: Close table
<!--```-->

<!--```mermaid
graph LR
S((Start)) --> <!--A(Select menu items and quantities)-->
<!--A --> <!--B(Add items to order)-->
<!--B --> <!--C(Review order)-->
<!--C --> <!--D{OK?}-->
<!--D -- no --> <!--C-->
<!--D -- yes --> <!--E(Send order to Waiter)-->
<!--E --> <!--F(Get served and eat)-->
<!--F --> <!--G{Want anything else?}-->
<!--G -- yes --> <!--A-->
<!--G -- no --> <!--H(Pay)-->
<!--H --> <!--I((End))-->
<!--```-->

## Client side app
The Android application, called “Al Dente Restaurant Solutions”, represents a solution to many problems restaurants have these days, such as waiting too long for the food, or not being able to flag your waiter. It also provides a digital menu from where the customers can order directly or request the service of their waiter. After they have added the items to the cart, they can preview the order, edit it if needed, and submit it. After the customer has been served, and he is done ordering, he can ask for the bill. A dialog will show up, where he can view the contents of the order, choose the payment method and the tip amount, and finally, request the check.

## Waiter side app
The waiter-side app allows the user to view a list of the tables he manages and their status. Upon clicking an entry, a more detailed view of the selected table will be displayed, including the ordered items. When a customer requests for service or submits a new order (basically when the status of the table changes), a notification will pop up on the waiter’s app.

## Kitchen side web app
The kitchen-side app is a SPA (Single Page Application) that interacts with the Clients and Waiters via Socket.IO. It receives the orders in real time and someone from the kitchen can update the status of an order, so the waiter can be notified to come and pick it up, in order to serve it.
