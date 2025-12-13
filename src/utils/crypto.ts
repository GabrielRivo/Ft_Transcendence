// WARNING: A mettre dans un common folder peut etre
import config from '../config.js';


import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// promisify est une fonction qui permet de convertir une fonction callback en une fonction async
import { promisify } from 'node:util';

// le salt est generer aleatoirement a chaque hash mais donc si un dump est fait on peut utiliser le salt
// c pour ca qu'il y a aussi un "pepper", que l'on rajoute a serait une constante fixe qui permet de hasher le mot de passe qui office de double securite

// WARNING: voir raf integration vault
const pepper = config.crypto.pepper;

const scryptAsync = promisify(scrypt);

// bcrypt like mais on depasse ou mini equivalent...
// pour securiser plus je pourrais ajouter SCRYPT_OPTIONS qui permet de customiser encore plus scrypt pour complexifier et pas avoir les settings par defaut...


export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(config.crypto.saltLength).toString('hex');
	const derivedKey = (await scryptAsync(password+pepper, salt, config.crypto.keyLength)) as Buffer;
	return `${salt}:${derivedKey.toString('hex')}`;
}



export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	// prend salt generer lors du hash
	const [salt, key] = storedHash.split(':');
	if (!salt || !key) return false;

	const keyBuffer = Buffer.from(key, 'hex');
	// scrypt est une fonction qui permet de hasher un mot de passe
	// qu'est ce qui si passe derriere ? password est le mot de passe en clair, salt est le sel, 64 est la longueur de la clé dérivée

	const derivedKey = (await scryptAsync(password+pepper, salt, config.crypto.keyLength)) as Buffer;

	// timingSafeEqual est une fonction qui permet de comparer deux bzuffers de manière sécurisée
	// en temps constant, ce qui permet d'éviter les attaques par timing attack
	// timing attack est une attaque qui consiste à mesurer le temps de réponse d'un système pour deviner le mot de passe
	// oui c possible xD

	// imagine que lettre par lettre son verifier, si invalide a le deuxieme lettre ca s'arrete
	// mais si valide jusqu'a la derniere lettre, ca va prendre plus de temps
	// ce que l'on peut en deduire si on se rapprocher ou pas

	// mais vue que c reelement hash salut et salud on tout meme une grosse difference qui peut etre deja faites a la premiere iteration
	// c plus utiliser dans une bonne pratique, l'attaque par timing attack et surtout utilisation dans la validation session / verification token...
	return timingSafeEqual(keyBuffer, derivedKey);
}

