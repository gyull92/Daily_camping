function deleteuser() {
    axios({
        method: 'delete',
        url: '/auth/logOff'
    })
        .then((res) => {
            confirm('정말 탈퇴하시겠습니까?');
            window.location.href = '/auth/login';
        })
        .catch((err) => {
            console.log(err);
        });
}