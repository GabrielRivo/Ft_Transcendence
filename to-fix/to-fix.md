## TODO
- Regler le probleme de memoire de rabbitmq
- Desactiver l'envoie de requetes (/games/game/active) lorsqu'on tape des caracteres dans un imput

- Corriger le visuel / limiter le nombre de caracteres dans la bio :

![alt text](image.png)

- Delete avatar n'est pas utilise : A activer ou a supprimer

- Bouton entree ne marche pas Activation 2FA

- Apres activation 2FA, lors de la connexion (OnlineUsersProvider.tsx ???):

![alt text](image-2.png)

- Faire des tests en tournoi/match/matchmaking et supprimer le compte en meme temps

- Ne se met pas a jour si on envoie la requete de mise a jour via l'API :

![alt text](image-3.png)


- Parsing des emails ([register](http://localhost:8080//api/auth/register)):

![alt text](image-4.png)

![alt text](image-5.png)

![alt text](image-6.png)

![alt text](image-7.png)

- Parsing du password :

![alt text](image-8.png)

![alt text](image-10.png)

- Refresh tokens:

![alt text](image-9.png)


Usernames :

- Creer un compte, modifier l'username via la route POST /api/auth/username, /me renvoie l'ancien username, impossible de creer un user avec le nouveau username malgre qu'il ne correspond pas a l'user, PATCH lui fonctionne


Liste amis devrait etre Not Found :

| **GET** | `/friends/:userId` | Get friend list | No | - |
| **GET** | `/pending/:userId` | Get pending requests | No | - |

![alt text](image-11.png)

![alt text](image-12.png)





Invitations :
| **POST** | `/invite` | Send friend request (ID) | Yes | `FriendManagementDto` |

![alt text](image-13.png)
![alt text](image-14.png)

Manipulation du senderUsername :
| **POST** | `/invite-by-username` | Send request (Username) | Yes | `InviteByUsernameDto` |
![alt text](image-15.png)

Delete friend :
Should be Not found : 0 only ???!
![alt text](image-16.png)


Block:
| **POST** | `/block` | Block a user | Yes | `FriendManagementDto` |
| **DELETE** | `/block` | Unblock a user | Yes | `AddFriendDto` |
![alt text](image-17.png)
![alt text](image-18.png)
![alt text](image-19.png)