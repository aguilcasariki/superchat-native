import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
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

const ChatRoom = () => {
  /* const messageRef = firestore().collection("messages");
  const dummy = useRef(null);
  const q = query(messageRef, orderBy("createdAt"), limit(25));
  const [messages] = firestore(q, { idField: "id" });
  const [formValue, setFormValue] = useState("");

  const sendMessage = async () => {
    const { uid, photoURL } = auth.currentUser || {};
    await addDoc(messageRef, {
      text: formValue,
      createdAt: new Date(),
      uid,
      photoURL,
    });
    setFormValue("");
    dummy.current?.scrollIntoView({ behavior: "smooth" });
  };
 */
  return (
    <View style={styles.chatRoom}>
      <Text>CHAT ROOM</Text>
      {/* <FlatList
        data={messages}
        renderItem={({ item }) => <ChatMessage message={item} />}
        keyExtractor={(item) => item.id}
        inverted // To show the latest messages at the bottom
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={formValue}
          onChangeText={setFormValue}
          placeholder="Type your message"
          style={styles.input}
        />
        <Button title="Send" onPress={sendMessage} disabled={!formValue} />
      </View> */}
    </View>
  );
};

const ChatMessage = ({ message }) => {
  const { text, uid } = message;
  const messageStyle =
    uid === auth.currentUser?.uid ? styles.myMessage : styles.otherMessage;

  return (
    <View style={[styles.messageContainer, messageStyle]}>
      <Text>{text}</Text>
    </View>
  );
};

const SignIn = () => {
  GoogleSignin.configure();
  async function onGoogleButtonPress() {
    try {
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
        signInResult.data.token
      );

      // Sign-in the user with the credential
      return auth().signInWithCredential(googleCredential);
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <View style={styles.signInContainer}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={() => {
          onGoogleButtonPress();
        }}
      />
    </View>
  );
};

const SignOut = () => {
  return (
    auth.currentUser && (
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
    backgroundColor: "#f0f0f0",
  },
  header: {
    backgroundColor: "#6200ee",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  chatRoom: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    height: 40,
  },
  messageContainer: {
    marginVertical: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  myMessage: {
    backgroundColor: "#6200ee",
    alignSelf: "flex-end",
    color: "#fff",
  },
  otherMessage: {
    backgroundColor: "#e0e0e0",
    alignSelf: "flex-start",
  },
  signInContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
});
