import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  Image,
} from "react-native";

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { StatusBar } from "expo-status-bar";

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  console.log("user", user);

  // Handle user state changes
  function onAuthStateChanged(user: React.SetStateAction<undefined>) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <Header />
      <View style={styles.chatContainer}>
        {user ? <ChatRoom /> : <SignIn />}
      </View>
    </View>
  );
}

const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerText}>Superchat</Text>
    <SignOut />
  </View>
);

// Asegúrate de que esta ruta sea correcta

const ChatRoom = () => {
  const messageRef = firestore().collection("messages");
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState("");
  const flatListRef = useRef(null); // Crear una referencia para FlatList

  // Fetch messages from Firestore
  useEffect(() => {
    const unsubscribe = messageRef
      .orderBy("createdAt")
      .limit(25)
      .onSnapshot(
        (snapshot) => {
          console.log("snapshot", snapshot);
          const fetchedMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(fetchedMessages);
        },
        (error) => console.log("error", error)
      );

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!formValue.trim()) return; // Evita enviar mensajes vacíos

    const { uid, photoURL } = auth().currentUser || {};
    setFormValue(""); // Limpiar el campo de entrada

    await messageRef.add({
      text: formValue,
      createdAt: new Date(),
      uid,
      photoURL,
    });
  };

  return (
    <View style={styles.chatRoom}>
      <FlatList
        onContentSizeChange={() =>
          flatListRef.current.scrollToEnd({ animated: true })
        }
        ref={flatListRef} // Asignar la referencia aquí
        data={messages}
        renderItem={({ item }) => <ChatMessage message={item} />}
        keyExtractor={(item) => item.id}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={formValue}
          onChangeText={setFormValue}
          placeholder="Type your message"
          style={styles.input}
        />
        <Button
          title="Send"
          onPress={sendMessage}
          disabled={!formValue.trim()}
        />
      </View>
    </View>
  );
};

const ChatMessage = ({ message }) => {
  const { text, uid, photoURL } = message;
  const messageStyle =
    uid === auth().currentUser?.uid ? styles.myMessage : styles.otherMessage;

  return (
    <View style={[styles.messageContainer, messageStyle]}>
      <Image
        source={{ uri: photoURL }}
        style={styles.userPhoto}
        resizeMode="cover"
      />
      <Text style={styles.messageText}>{text}</Text>
    </View>
  );
};

const SignIn = () => {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
  async function onGoogleButtonPress() {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    // Get the users ID token
    const signInResult = await GoogleSignin.signIn();

    // Try the new style of google-sign in result, from v13+ of that module
    idToken = signInResult.data?.idToken;
    if (!idToken) {
      // if you are using older versions of google-signin, try old style result
      idToken = signInResult.idToken;
    }
    if (!idToken) {
      throw new Error("No ID token found");
    }
    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(
      signInResult.data?.idToken || ""
    );

    return auth().signInWithCredential(googleCredential);
  }
  return (
    <View style={styles.signInContainer}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={() =>
          onGoogleButtonPress().then(() =>
            console.log("Signed in with Google!")
          )
        }
      />
    </View>
  );
};

const SignOut = () => {
  return (
    auth().currentUser && (
      <Button
        title="Sign Out"
        onPress={() => auth().signOut()}
        color="#ff0000"
      />
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Light gray background
  },
  header: {
    backgroundColor: "#007AFF", // Blue header
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: "#fff",
  },
  chatRoom: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 16,
    marginRight: 10,
    height: 50,
    backgroundColor: "#fff",
    color: "#333",
  },
  messageContainer: {
    marginVertical: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 10,
  },
  userPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messageText: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  myMessage: {
    alignSelf: "flex-end",

    color: "#fff",
    textAlign: "right",
    padding: 10,
    borderRadius: 20,

    flexDirection: "row-reverse",
  },

  // Update the otherMessage style
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    color: "#333",
    textAlign: "left",
    padding: 10,
    borderRadius: 20,
    maxWidth: "70%",
    flexDirection: "row",
  },
  signInContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#fff",
  },
});
